-- 2FA/MFA Tables and Functions
-- This migration adds support for Two-Factor Authentication

-- Create table for 2FA secrets
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[], -- Array of hashed backup codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enabled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Enable RLS on user_2fa
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
    ON user_2fa
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings"
    ON user_2fa
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
    ON user_2fa
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings"
    ON user_2fa
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create table for 2FA verification logs
CREATE TABLE IF NOT EXISTS user_2fa_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'enabled', 'disabled', 'verified', 'failed'
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_2fa_logs
ALTER TABLE user_2fa_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own 2FA logs
CREATE POLICY "Users can view their own 2FA logs"
    ON user_2fa_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_logs_user_id ON user_2fa_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_logs_created_at ON user_2fa_logs(created_at DESC);

-- Add 2FA preference to user settings (if user_settings table exists)
-- If you don't have a user_settings table, you can skip this or create one
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS require_captcha_login BOOLEAN DEFAULT false;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS require_captcha_signup BOOLEAN DEFAULT true;
    END IF;
END
$$;
