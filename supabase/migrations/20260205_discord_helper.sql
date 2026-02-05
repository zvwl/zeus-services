-- Helper function to get Discord user ID from auth identities
-- This allows us to retrieve a user's Discord ID after they connect via OAuth

CREATE OR REPLACE FUNCTION public.get_discord_id(p_user_id UUID)
RETURNS TEXT
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT identity_data->>'provider_id'
    FROM auth.identities
    WHERE user_id = p_user_id
    AND provider = 'discord'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_discord_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discord_id(UUID) TO service_role;
