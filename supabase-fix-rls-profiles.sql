-- Drop existing policies first to safely re-create them without errors
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Enable RLS on profiles (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. UPDATE Policy
-- Allows users to update their own row (needed for XP, Level, Login Date)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING ( auth.uid() = id );

-- 2. INSERT Policy
-- Allows users to create their row if it doesn't exist (needed for Upsert/Registration)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- 3. SELECT Policy
-- Allows public read access (needed for leaderboards or viewing profiles)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING ( true );
