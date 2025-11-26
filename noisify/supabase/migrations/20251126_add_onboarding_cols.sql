-- Add opening_hours and social_links columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN organizations.opening_hours IS 'JSON object storing opening hours (e.g., { "monday": { "open": "10:00", "close": "18:00" } })';
COMMENT ON COLUMN organizations.social_links IS 'JSON object storing social media links (e.g., { "instagram": "url", "facebook": "url" })';
