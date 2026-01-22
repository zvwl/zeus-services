\-\- ⚠️ DEPRECATED: USE SUPABASE'S BUILT-IN MFA INSTEAD
\-\- 
\-\- Supabase has native MFA/2FA support built into the auth schema.
\-\- You don't need custom tables - use Supabase's JavaScript API instead.
\-\-
\-\- Built-in tables (already available):
\-\-   - auth.mfa_factors
\-\-   - auth.mfa_challenges  
\-\-   - auth.mfa_amr_claims
\-\-
\-\- Documentation: https://supabase.com/docs/guides/auth/auth-mfa
\-\-
\-\- If you already ran the old custom tables, you can drop them:

\-\- DROP TABLE IF EXISTS user_2fa_logs CASCADE;
\-\- DROP TABLE IF EXISTS user_2fa CASCADE;

\-\- No migration needed - MFA is already enabled in Supabase Auth settings!
