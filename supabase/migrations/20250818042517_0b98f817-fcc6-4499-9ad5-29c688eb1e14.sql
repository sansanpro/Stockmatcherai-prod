-- Delete all data for hassan.omarit@gmail.com

-- First, get the user_id from profiles table
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get user_id from profiles table
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'hassan.omarit@gmail.com';
    
    -- If user exists, delete from all tables
    IF target_user_id IS NOT NULL THEN
        -- Delete from all user-related tables
        DELETE FROM public.recommendation_sessions WHERE user_id = target_user_id;
        DELETE FROM public.daily_swipe_limits WHERE user_id = target_user_id;
        DELETE FROM public.ai_recommendations WHERE user_id = target_user_id;
        DELETE FROM public.user_feedback WHERE user_id = target_user_id;
        DELETE FROM public.user_watchlists WHERE user_id = target_user_id;
        DELETE FROM public.user_matches WHERE user_id = target_user_id;
        DELETE FROM public.user_profiles WHERE user_id = target_user_id;
        DELETE FROM public.profiles WHERE id = target_user_id;
    END IF;
    
    -- Delete from subscribers table by email
    DELETE FROM public.subscribers WHERE email = 'hassan.omarit@gmail.com';
    
    RAISE NOTICE 'Deleted all data for hassan.omarit@gmail.com';
END $$;