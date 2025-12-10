-- Migration: Add requires_alias_change column to profiles table
-- This column is used to force users to change their alias when set to true

-- Add the column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS requires_alias_change BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.requires_alias_change IS 'When true, user must choose a new alias upon login. Set by staff when banning an alias.';

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_requires_alias_change ON public.profiles(requires_alias_change) WHERE requires_alias_change = true;
