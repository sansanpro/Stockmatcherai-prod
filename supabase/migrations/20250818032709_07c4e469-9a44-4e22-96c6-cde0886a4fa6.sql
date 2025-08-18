-- Add AI recommendations tracking table
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  recommendations JSONB NOT NULL,
  user_profile JSONB NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'gpt-4',
  confidence_score NUMERIC(3,2),
  diversification_score NUMERIC(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add user feedback tracking table
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_id UUID REFERENCES public.ai_recommendations(id),
  stock_ticker TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('like', 'dislike', 'match', 'pass')),
  is_ai_recommendation BOOLEAN NOT NULL DEFAULT true,
  feedback_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add recommendation sessions for A/B testing
CREATE TABLE public.recommendation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('ai', 'classic', 'hybrid')),
  recommendations_shown INTEGER DEFAULT 0,
  matches_count INTEGER DEFAULT 0,
  passes_count INTEGER DEFAULT 0,
  session_duration_seconds INTEGER,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Extend user_profiles with AI-learned preferences
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_learned_preferences JSONB DEFAULT '{}';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS behavior_patterns JSONB DEFAULT '{}';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_ai_analysis TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_recommendations
CREATE POLICY "Users can view their own AI recommendations" 
ON public.ai_recommendations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI recommendations" 
ON public.ai_recommendations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_feedback
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON public.user_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for recommendation_sessions
CREATE POLICY "Users can manage their own sessions" 
ON public.recommendation_sessions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX idx_ai_recommendations_session_id ON public.ai_recommendations(session_id);
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_recommendation_id ON public.user_feedback(recommendation_id);
CREATE INDEX idx_recommendation_sessions_user_id ON public.recommendation_sessions(user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_ai_recommendations_updated_at
BEFORE UPDATE ON public.ai_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();