import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Minimize2, Crown } from 'lucide-react';
import AIDataConsentDialog from '@/components/AIDataConsentDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UpgradeModal from '@/components/UpgradeModal';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: Array<{ name: string; args: any; result: any }>;
  status?: 'fetching' | 'analyzing' | 'generating' | 'complete' | 'error';
}

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [freeMessageCount, setFreeMessageCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [hasOpenedWidget, setHasOpenedWidget] = useState(() =>
    localStorage.getItem('ai_widget_opened') === 'true'
  );
  
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch actual message count from last 24 hours when widget opens
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (!user || subscribed || !isOpen) return;

      try {
        // Get user's conversations
        const { data: conversations } = await supabase
          .from('ai_chat_conversations')
          .select('id')
          .eq('user_id', user.id);

        if (!conversations || conversations.length === 0) {
          setFreeMessageCount(0);
          return;
        }

        const conversationIds = conversations.map(c => c.id);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Count messages from last 24 hours
        const { count } = await supabase
          .from('ai_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'user')
          .in('conversation_id', conversationIds)
          .gte('created_at', twentyFourHoursAgo);

        setFreeMessageCount(count || 0);
      } catch (error) {
        console.error('Error fetching message count:', error);
      }
    };

    fetchMessageCount();
  }, [user, subscribed, isOpen]);

  const streamMessage = async (userMessage: string) => {
    setIsStreaming(true);
    setCurrentStatus('Connecting...');

    // Add user message to UI
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Create placeholder for assistant response
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      toolCalls: [],
      status: 'fetching'
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortControllerRef.current = new AbortController();
      
      // Set 60-second timeout
      timeoutRef.current = window.setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          toast.error('Request timed out. This query may be too complex. Please try a simpler question.');
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, status: 'error', content: 'Request timed out after 60 seconds. Please try asking a simpler question or breaking this into multiple questions.' }
              : m
          ));
          setIsStreaming(false);
          setCurrentStatus('');
        }
      }, 60000); // 60 seconds

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to use the AI assistant');
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        setIsStreaming(false);
        return;
      }

      const response = await fetch(
        'https://lswusuoiwyxtswnbllgk.supabase.co/functions/v1/stock-assistant',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxzd3VzdW9pd3l4dHN3bmJsbGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU1MjgsImV4cCI6MjA2NjY0MTUyOH0.g7DgedllsJSFJyGYHfeYq_r9YWSjzCYXdHC7F4SL6Ao'
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (response.status === 403) {
        const data = await response.json();
        // Free user hit limit - remove the placeholder message and show upgrade
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId && m.id !== userMsg.id));
        toast.error(data.message || 'You\'ve reached your free message limit');
        setShowUpgradeModal(true);
        setIsStreaming(false);
        return;
      }

      if (response.status === 429) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        setIsStreaming(false);
        return;
      }

      if (response.status === 402) {
        toast.error('AI credits exhausted. Please contact support.');
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        setIsStreaming(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI response error:', response.status, errorText);
        
        // Parse error message if it's JSON
        let errorMessage = 'Failed to get AI response. Please try again.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Not JSON, use default message
        }
        
        toast.error(errorMessage);
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        setIsStreaming(false);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const chunk = JSON.parse(jsonStr);

            if (chunk.type === 'content_delta') {
              setCurrentStatus('Generating response...');
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + chunk.delta, status: 'generating' }
                  : msg
              ));
            } else if (chunk.type === 'tool_call') {
              const toolName = chunk.tool.name.replace('get_', '').replace('_', ' ');
              setCurrentStatus(`Fetching ${toolName}...`);
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { 
                      ...msg, 
                      toolCalls: [...(msg.toolCalls || []), chunk.tool],
                      status: 'fetching'
                    }
                  : msg
              ));
            } else if (chunk.type === 'analyzing') {
              setCurrentStatus('Analyzing data...');
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, status: 'analyzing' }
                  : msg
              ));
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      }
      
      // Mark as complete
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, status: 'complete' }
          : msg
      ));

      // Handle empty response
      const finalMessage = messages.find(m => m.id === assistantMsgId);
      if (finalMessage && !finalMessage.content.trim()) {
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: "I couldn't generate a response. Please try rephrasing your question.", status: 'error' }
            : m
        ));
        toast.error('Received empty response. Please try again.');
      } else {
        // Increment free message count on successful response
        if (!subscribed) {
          setFreeMessageCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        // Error message already set by timeout handler
      } else {
        console.error('Stream error:', error);
        toast.error('Failed to get response. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
      }
    } finally {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsStreaming(false);
      setCurrentStatus('');
      abortControllerRef.current = null;
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return;
    const hasConsent = localStorage.getItem('ai_data_consent') === 'true';
    if (!hasConsent) {
      setPendingMessage(inputValue.trim());
      setShowConsentDialog(true);
      return;
    }
    streamMessage(inputValue.trim());
  };

  const handleConsentGranted = () => {
    setShowConsentDialog(false);
    if (pendingMessage) {
      streamMessage(pendingMessage);
      setPendingMessage(null);
    }
  };

  const handleConsentDenied = () => {
    setShowConsentDialog(false);
    setPendingMessage(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    // Don't reset freeMessageCount - it persists across conversations in 24h period
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button — sits above the nav bar */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (!hasOpenedWidget) {
              setHasOpenedWidget(true);
              localStorage.setItem('ai_widget_opened', 'true');
            }
          }}
          aria-label="Open AI Assistant"
          className="fixed bottom-[7.5rem] right-4 md:bottom-8 md:right-6 z-[55] flex items-center gap-2 h-14 rounded-full shadow-2xl px-4
            bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700
            text-white transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}
        >
          {/* Pulsing attention ring for new users */}
          {!hasOpenedWidget && (
            <span className="absolute inset-0 rounded-full bg-purple-400/50 animate-ping pointer-events-none" />
          )}
          <Sparkles className="h-5 w-5 flex-shrink-0" />
          {!hasOpenedWidget && (
            <span className="text-sm font-semibold pr-1 whitespace-nowrap">Ask AI</span>
          )}
        </button>
      )}

      {/* Chat Widget — full height above nav on mobile, floating card on desktop */}
      {isOpen && (
        <Card className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4rem)] bottom-[7.5rem] md:inset-x-auto md:top-auto md:left-auto md:bottom-8 md:right-6 md:w-[400px] md:h-[600px] md:max-h-[calc(100vh-5rem)] shadow-2xl z-[60] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Stock Assistant</h3>
              {subscribed && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  disabled={isStreaming}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4">
                <Sparkles className="h-10 w-10 text-primary opacity-50" />
                <div>
                  <p className="font-semibold mb-1">
                    {subscribed ? 'Ask me anything about stocks!' : 'Try the AI Assistant'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {subscribed
                      ? 'Real-time data, company insights, and market analysis.'
                      : 'Upgrade for unlimited access. Try a question below!'}
                  </p>
                </div>
                {/* Suggested prompts */}
                <div className="w-full space-y-2">
                  {[
                    "Why is NVIDIA a good match for me?",
                    "What's the safest dividend stock right now?",
                    "Explain P/E ratio in simple terms",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInputValue(prompt)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                              {msg.toolCalls.map((tool, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  📊 Fetched {tool.name.replace('get_', '')} for {JSON.stringify(tool.args)}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        {currentStatus && (
                          <span className="text-xs text-muted-foreground">{currentStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={subscribed ? "Ask about stocks..." : "Try asking about a stock..."}
                disabled={isStreaming}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!subscribed && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Free users: {2 - freeMessageCount} messages remaining
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      {/* AI Data Consent Dialog */}
      <AIDataConsentDialog
        isOpen={showConsentDialog}
        onConsent={handleConsentGranted}
        onCancel={handleConsentDenied}
      />
    </>
  );
}