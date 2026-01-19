# Zeus Services Deployment Guide

## 📦 Step 1: Push to GitHub

Your local repository is ready! Now create a GitHub repository:

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `zeus-services` (or your preferred name)
3. Description: "Zeus Services - Professional service marketplace with Supabase authentication"
4. Choose **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

Then run these commands in your terminal:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/zeus-services.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

## 👥 Step 2: Add Your Friend as Collaborator

1. On your GitHub repository page, click **Settings**
2. Click **Collaborators** in the left sidebar
3. Click **Add people**
4. Enter your friend's GitHub username or email
5. Select their account and click **Add [username] to this repository**
6. They'll receive an invitation email

Your friend can then clone the repository:

```powershell
git clone https://github.com/YOUR-USERNAME/zeus-services.git
cd zeus-services
npm install
```

They'll need to create their own `.env` file with the Supabase credentials (send them separately, never commit `.env`!).

## 🚀 Step 3: Deploy to Vercel (Recommended)

Vercel is perfect for React apps and has great GitHub integration:

### Deploy with Vercel:

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub
3. Click **Add New Project**
4. Import your `zeus-services` repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click **Deploy**

Your site will be live at `https://zeus-services.vercel.app` (or similar) in ~2 minutes!

### Alternative: Netlify

1. Go to [https://app.netlify.com](https://app.netlify.com)
2. Click **Add new site** > **Import an existing project**
3. Connect to GitHub and select your repository
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables (same as Vercel)
6. Click **Deploy site**

## 🌐 Step 4: Connect GoDaddy Domain

Once deployed, connect your GoDaddy domain:

### For Vercel:

1. In Vercel dashboard, go to your project **Settings** > **Domains**
2. Enter your domain (e.g., `zeusservices.com`)
3. Click **Add**
4. Vercel will show you DNS records to add

5. In GoDaddy:
   - Log in to [GoDaddy](https://www.godaddy.com)
   - Go to **My Products** > **Domains** > **DNS**
   - Click your domain
   - Add these records (Vercel will show exact values):
     - **Type**: `A` | **Name**: `@` | **Value**: Vercel's IP
     - **Type**: `CNAME` | **Name**: `www` | **Value**: `cname.vercel-dns.com`

6. Wait 15-60 minutes for DNS propagation

### For Netlify:

1. In Netlify dashboard, go to **Domain settings**
2. Click **Add custom domain**
3. Enter your domain
4. Netlify will show DNS records

5. In GoDaddy, add:
   - **Type**: `CNAME` | **Name**: `www` | **Value**: your Netlify URL
   - **Type**: `A` | **Name**: `@` | **Value**: `75.2.60.5` (Netlify's load balancer)

## 🔐 Step 5: Update Supabase Settings

After deploying with your custom domain:

1. Go to Supabase dashboard > **Authentication** > **URL Configuration**
2. Set **Site URL** to: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com/**`
   - `https://www.yourdomain.com/**`
   - Keep `http://localhost:5173/**` for local dev
4. Click **Save**

## ✅ Automatic Deployments

Now when you or your friend:
- Push to the `main` branch
- Vercel/Netlify will automatically rebuild and deploy
- Changes go live in ~2 minutes

## 🔄 Collaboration Workflow

Your friend should:

```powershell
# Clone the repo (first time)
git clone https://github.com/YOUR-USERNAME/zeus-services.git
cd zeus-services
npm install

# Create .env file with Supabase keys (you'll send these securely)

# Start developing
npm run dev

# When making changes:
git add .
git commit -m "Description of changes"
git push origin main
```

## 📝 Best Practices

- Never commit `.env` file (already in `.gitignore`)
- Share Supabase credentials securely (Signal, encrypted email, etc.)
- Create feature branches for big changes: `git checkout -b feature-name`
- Use pull requests for code review before merging to main
- Keep the README updated with new features

## 🆘 Troubleshooting

### Build fails on Vercel/Netlify
- Check environment variables are set correctly
- Make sure build command is `npm run build`
- Check build logs for specific errors

### Domain not connecting
- Wait 24-48 hours for full DNS propagation
- Use [dnschecker.org](https://dnschecker.org) to verify DNS changes
- Make sure you're using the exact DNS records from Vercel/Netlify

### Friend can't see changes
- Make sure they ran `git pull origin main`
- They may need to run `npm install` if dependencies changed
- Clear browser cache or use incognito mode

---

Your Zeus Services shop is ready to go live! 🚀⚡
