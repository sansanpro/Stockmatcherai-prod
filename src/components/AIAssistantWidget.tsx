import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, RotateCcw, Crown, GraduationCap } from 'lucide-react';
import AIDataConsentDialog, { AI_CONSENT_KEY } from '@/components/AIDataConsentDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, useSubscription } from '@/contexts/SubscriptionContext';
import { useApp } from '@/contexts/AppContext';
import UpgradeModal from '@/components/UpgradeModal';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';
import Disclaimer from '@/components/values/Disclaimer';
import { ASK_AI_EVENT, tutorPrompt } from '@/lib/askAI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'fetching' | 'analyzing' | 'generating' | 'complete' | 'error';
}

// Short status shown while the assistant looks something up (the raw data isn't displayed)
function describeToolCall(tool: { name: string; args?: Record<string, unknown> }): string {
  const symbol = typeof tool.args?.symbol === 'string' ? tool.args.symbol.toUpperCase() : '';
  switch (tool.name) {
    case 'get_stock_quote': return `Checking ${symbol || 'the'} price...`;
    case 'get_company_profile': return `Looking up ${symbol || 'the company'}...`;
    case 'get_company_news': return `Reading ${symbol ? `${symbol} ` : ''}news...`;
    case 'get_market_news': return 'Reading market news...';
    case 'get_top_performers': return 'Ranking stocks...';
    case 'get_price_performance': return `Checking ${symbol || 'its'} performance...`;
    default: return 'Looking that up...';
  }
}

interface AIAssistantWidgetProps {
  // Signed out: the button stays visible and asks for a free account instead of opening the chat
  onNeedAccount?: () => void;
  // The swipe deck has its own Ask AI button, so the floating one steps aside there
  hideLauncher?: boolean;
}

export default function AIAssistantWidget({ onNeedAccount, hideLauncher = false }: AIAssistantWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'ai' | 'tutor'>('ai');
  const [tutorMode, setTutorMode] = useState(false); // Premium: step-by-step answers
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
  const { watchlist } = useApp();
  const freeQuestions = PLAN_LIMITS.free.aiQuestionsPer24h;
  const outOfQuestions = !subscribed && freeMessageCount >= freeQuestions;
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // "Ask AI about this company" elsewhere in the app opens the chat with the question filled in
  useEffect(() => {
    const onAsk = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt;
      if (!user) { onNeedAccount?.(); return; }
      setIsOpen(true);
      if (prompt) setInputValue(prompt);
      track('ai_prefilled_question');
    };
    window.addEventListener(ASK_AI_EVENT, onAsk);
    return () => window.removeEventListener(ASK_AI_EVENT, onAsk);
  }, [user, onNeedAccount]);

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

        // Count answered questions from the last 24 hours (the server counts the same way)
        const { count } = await supabase
          .from('ai_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'assistant')
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
    track('ai_message_sent', { subscribed });
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
            message: tutorMode && subscribed ? tutorPrompt(userMessage) : userMessage,
            conversationId
          }),
          signal: abortControllerRef.current.signal
        }
      );

      if (response.status === 403) {
        const data = await response.json();
        // Free user hit the limit: remove the placeholder message; the upgrade sheet explains why
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId && m.id !== userMsg.id));
        setFreeMessageCount(data.freeMessagesSent ?? freeQuestions);
        setUpgradeReason('ai');
        setShowUpgradeModal(true);
        setIsStreaming(false);
        return;
      }

      if (response.status === 429) {
        // Say so in the chat, where the question is waiting, rather than in a toast that vanishes
        const data = await response.json().catch(() => ({}));
        const busy = data.error || 'The AI is busy right now. Please try again in a moment.';
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, status: 'error', content: busy } : m));
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
      let receivedContent = '';
      let streamError: string | null = null;

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
              receivedContent += chunk.delta;
              setCurrentStatus('');
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + chunk.delta, status: 'generating' }
                  : msg
              ));
            } else if (chunk.type === 'restart') {
              // The server is retrying a cut-off answer; replace what was shown so far
              receivedContent = '';
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId ? { ...msg, content: '', status: 'analyzing' } : msg
              ));
              setCurrentStatus('Writing answer...');
            } else if (chunk.type === 'tool_call') {
              setCurrentStatus(describeToolCall(chunk.tool));
            } else if (chunk.type === 'analyzing') {
              setCurrentStatus('Writing answer...');
              setMessages(prev => prev.map(msg =>
                msg.id === assistantMsgId
                  ? { ...msg, status: 'analyzing' }
                  : msg
              ));
            } else if (chunk.type === 'error') {
              streamError = chunk.message || 'Something went wrong. Please try again.';
            }
          } catch (e) {
            console.error('Failed to parse SSE chunk:', e);
          }
        }
      }
      
      if (streamError || !receivedContent.trim()) {
        const errorText = streamError ?? "I couldn't generate a response. Please try rephrasing your question.";
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: receivedContent || errorText, status: 'error' }
            : m
        ));
        toast.error(errorText);
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, status: 'complete' }
            : msg
        ));
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
    const hasConsent = localStorage.getItem(AI_CONSENT_KEY) === 'true';
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

  if (!user && !onNeedAccount) return null;

  return (
    <>
      {/* Floating Button — sits above the nav bar */}
      {!isOpen && !hideLauncher && (
        <button
          onClick={() => {
            if (!user) { track('ai_widget_signed_out_tap'); onNeedAccount?.(); return; }
            setIsOpen(true);
            if (!hasOpenedWidget) {
              setHasOpenedWidget(true);
              localStorage.setItem('ai_widget_opened', 'true');
            }
          }}
          aria-label="Open Ask AI"
          data-ai-assistant
          className="fixed bottom-[7.5rem] right-4 md:bottom-8 md:right-6 z-[75] flex items-center gap-2 h-14 rounded-full px-4
            bg-primary hover:bg-clay-ink shadow-[0_10px_26px_rgb(var(--shadow)/0.35)]
            text-primary-foreground transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
        >
          {/* Pulsing attention ring for new users */}
          {!hasOpenedWidget && (
            <span className="absolute inset-0 rounded-full bg-highlight/40 animate-ping [animation-iteration-count:3] [animation-fill-mode:forwards] pointer-events-none" />
          )}
          <Sparkles className="h-5 w-5 flex-shrink-0" />
          {!hasOpenedWidget && (
            <span className="text-sm font-semibold pr-1 whitespace-nowrap">Ask AI</span>
          )}
        </button>
      )}

      {/* Chat Widget — full height above nav on mobile, floating card on desktop */}
      {isOpen && (
        <Card data-ai-assistant role="complementary" aria-label="Ask AI" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4rem)] bottom-[7.5rem] md:inset-x-auto md:top-auto md:left-auto md:bottom-8 md:right-6 md:w-[400px] md:h-[600px] md:max-h-[calc(100vh-5rem)] shadow-2xl z-[76] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Ask AI</h3>
              {subscribed && (
                <Crown className="h-4 w-4 text-premium" aria-label="Premium" />
              )}
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  disabled={isStreaming}
                  aria-label="Start a new chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close Ask AI"
                className="h-11 w-11"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center text-center gap-3 px-2 py-2">
                <Sparkles className="h-8 w-8 text-primary opacity-50" aria-hidden />
                <div>
                  <p className="font-semibold mb-1">
                    Ask about any company or term
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {subscribed
                      ? 'What a company does, how it connects to your causes, or what a number means.'
                      : outOfQuestions
                        ? 'Your free questions for today are used. They come back one by one, 24 hours after each was asked.'
                        : `You get ${freeQuestions} free questions a day. Try one below.`}
                  </p>
                </div>
                {/* Suggested prompts */}
                {!outOfQuestions && <div className="w-full space-y-2">
                  {[
                    `How does ${watchlist[0]?.companyName ?? 'Merck'} connect to my causes?`,
                    "How do people research a company before investing?",
                    "Explain P/E ratio in simple terms",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInputValue(prompt)}
                      className="w-full min-h-[44px] text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.filter(msg => msg.role === 'user' || msg.content).map((msg) => (
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
                        <div className="text-sm prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isStreaming && !(messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content) && (
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
            {/* Tutor mode: Premium; free users see what it is and where it comes from */}
            <button
              onClick={() => {
                if (!subscribed) { setUpgradeReason('tutor'); setShowUpgradeModal(true); return; }
                setTutorMode(on => !on);
                track('ai_tutor_mode', { on: !tutorMode });
              }}
              aria-pressed={subscribed ? tutorMode : undefined}
              className={`tap-target mb-2 min-h-[32px] px-3 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                tutorMode && subscribed ? 'bg-premium text-primary-foreground border-premium' : 'bg-premium-tint text-premium-ink border-premium-line'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" aria-hidden />
              Step by step{tutorMode && subscribed ? ': on' : ''}
              {!subscribed && <Crown className="w-3 h-3" aria-label="Premium" />}
            </button>
            {outOfQuestions ? (
              // Out of free questions: say so before they type, not after
              <div role="status" className="rounded-xl bg-premium-tint border border-premium-line p-3 text-sm text-ink">
                <p><span className="font-semibold">You've used today's {freeQuestions} free questions.</span> Each one frees up 24 hours after you asked it.</p>
                <button onClick={() => { setUpgradeReason('ai'); setShowUpgradeModal(true); }} className="mt-1 font-semibold text-premium-ink underline min-h-[44px]">
                  See Premium
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about a company or term…"
                  disabled={isStreaming}
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  className="flex-1 h-11 text-base"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming}
                  aria-label="Send message"
                  size="icon"
                  className="h-11 w-11"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!subscribed && freeMessageCount < freeQuestions && (
              <p className="text-xs text-ink-soft mt-2 text-center">
                {freeQuestions - freeMessageCount} of {freeQuestions} free questions left today (each frees up after 24 hours)
              </p>
            )}
            <Disclaimer className="mt-1" />
          </div>
        </Card>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        reason={upgradeReason}
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