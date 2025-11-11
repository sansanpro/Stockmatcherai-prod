-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  experience TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (no auth required for waitlist)
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view waitlist (optional - for future use)
CREATE POLICY "Service role can view waitlist" 
ON public.waitlist 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Add index on email for uniqueness check
CREATE UNIQUE INDEX waitlist_email_idx ON public.waitlist(email);