-- Add is_active column to chat_groups if it doesn't exist
ALTER TABLE public.chat_groups 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE public.chat_groups 
SET is_active = true 
WHERE is_active IS NULL;
