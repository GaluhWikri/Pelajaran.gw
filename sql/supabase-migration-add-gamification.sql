-- Add Gamification Columns to Profiles Table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date TEXT; -- Storing as YYYY-MM-DD string

-- Update existing rows to have default values if null
UPDATE public.profiles 
SET level = 1 WHERE level IS NULL;

UPDATE public.profiles 
SET current_xp = 0 WHERE current_xp IS NULL;
