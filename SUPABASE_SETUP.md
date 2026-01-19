# 🚀 Supabase Setup Guide for Zeus Services

## Prerequisites
- A Supabase account (free tier available)
- Your Zeus Services project ready

## Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create a free account
3. Click "New Project"
4. Fill in the details:
   - **Name**: Zeus Services (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest to your users
   - **Plan**: Free tier is perfect to start
5. Click "Create new project" and wait ~2 minutes for setup

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Project Settings** (gear icon)
2. Click on **API** in the left sidebar
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long JWT token

   

## Step 3: Configure Your Local Project

1. In your Zeus Services project root, create a `.env` file:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **IMPORTANT**: Never commit the `.env` file! (It's already in .gitignore)

## Step 4: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Optional: Configure email templates under **Authentication** > **Email Templates**

## Step 5: Configure Site URL (Important!)

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/**`
   - Your production URL when you deploy (e.g., `https://yourdomain.com/**`)

## Step 6: Restart Your Dev Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Step 7: Test Your Authentication

1. Navigate to `http://localhost:5173/signup`
2. Create a new account
3. Check your Supabase dashboard under **Authentication** > **Users** to see your new user!

## 🎉 You're Done!

Your Zeus Services shop now has:
- ✅ Production-ready authentication
- ✅ PostgreSQL database (500MB free)
- ✅ Secure password hashing (bcrypt)
- ✅ JWT token management
- ✅ Email verification (optional)
- ✅ Password reset functionality (built-in)

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you created the `.env` file in the project root
- Check that your keys are correct (no extra spaces)
- Restart your dev server after creating `.env`

### "Invalid API key"
- Double-check you copied the **anon public** key, not the service role key
- Make sure there are no quotes around the key in your `.env` file

### Users not appearing in dashboard
- Check the Authentication tab (not the Database tab)
- Ensure email provider is enabled in Authentication > Providers

### Emails landing in Spam
To improve deliverability and keep verification/reset emails out of spam:

- Configure a custom sender with a verified domain
   - In Supabase: Authentication > SMTP, set up a trusted provider (Resend, Postmark, SendGrid, AWS SES)
   - Use a branded from-address like `no-reply@yourdomain.com`
   - Verify your domain with your provider
- Add DNS records for your domain
   - SPF: include your email provider (e.g., `v=spf1 include:spf.sendgrid.net ~all`)
   - DKIM: add TXT records provided by your email provider
   - DMARC: start with `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
- Customize templates (Authentication > Email Templates)
   - Set a friendly subject and from-name (e.g., "Zeus Services")
   - Include both HTML and plain-text versions
   - Avoid spammy words and excessive imagery
- Add your local and production URLs in Authentication > URL Configuration
   - Site URL and Redirect URLs for both `http://localhost:5173/**` and your domain
- Tell users to whitelist the sender
   - Ask them to mark "Not spam" and add `no-reply@yourdomain.com` to contacts
- Test deliverability
   - Use tools like mail-tester.com and check your provider’s deliverability dashboard

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add your production URL to Supabase **Redirect URLs**
2. Set environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Update the **Site URL** in Supabase to your production domain

## Free Tier Limits

Supabase free tier includes:
- 500MB database space
- 50,000 monthly active users
- 2GB file storage
- 5GB bandwidth
- Unlimited API requests

Perfect for getting started!
