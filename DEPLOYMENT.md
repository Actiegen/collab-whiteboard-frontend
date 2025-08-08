# 🚀 Deployment Guide - Vercel

This guide explains how to deploy the Collab Whiteboard Frontend to Vercel.

## 📋 Prerequisites

- [Vercel](https://vercel.com) account
- [Google Cloud Console](https://console.cloud.google.com) account
- Project code on GitHub
- Backend already deployed on Google Cloud Run

## 🔧 Google Cloud Configuration

### 1. Configure OAuth 2.0

1. Access the [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Name**: Collab Whiteboard Frontend
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://your-app.vercel.app` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-app.vercel.app/api/auth/callback/google` (production)

### 2. Get Credentials

- **Client ID**: Copy the OAuth client ID
- **Client Secret**: Copy the OAuth client secret

## 🚀 Deploy to Vercel

### 1. Prepare Repository

```bash
# Make sure code is on GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Login with your GitHub account
3. Click **New Project**
4. Import the `collab-whiteboard-frontend` repository

### 3. Configure Environment Variables

In Vercel, go to **Settings** > **Environment Variables** and add:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app
NEXT_PUBLIC_WS_URL=wss://your-backend-url.run.app

# Debug Configuration
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=info
```

### 4. Generate NEXTAUTH_SECRET

```bash
# In terminal, generate a secret key
openssl rand -base64 32
```

### 5. Configure Domain

1. In Vercel, go to **Settings** > **Domains**
2. Add your custom domain (optional)
3. Copy the Vercel URL (e.g., `https://your-app.vercel.app`)

### 6. Update Google OAuth

1. Go back to Google Cloud Console
2. Edit your OAuth credentials
3. Add the Vercel URL:
   - **Authorized JavaScript origins**: `https://your-app.vercel.app`
   - **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/callback/google`

### 7. Deploy

1. In Vercel, click **Deploy**
2. Wait for the build to complete
3. Test the application

## 🔧 Advanced Configuration

### Build Settings

Vercel automatically detects it's a Next.js project, but you can configure:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### Environment Variables by Environment

Configure different variables for development and production:

- **Production**: Use production URLs
- **Preview**: Use staging URLs (if applicable)
- **Development**: Use local URLs

### Custom Domain

1. Go to **Settings** > **Domains**
2. Add your domain
3. Configure DNS as per Vercel instructions
4. Update Google OAuth with the new domain

## 🐛 Troubleshooting

### Authentication Error

- Check if URLs in Google OAuth are correct
- Confirm `NEXTAUTH_URL` is configured correctly
- Verify `NEXTAUTH_SECRET` was generated correctly

### Backend Connection Error

- Confirm `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are correct
- Check if backend is running on Google Cloud Run
- Test URLs directly in browser

### Build Failures

- Check if all dependencies are in `package.json`
- Confirm there are no TypeScript errors
- Check build logs in Vercel

### WebSocket Connection Issues

- Confirm `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
- Check if backend supports WebSocket
- Test WebSocket connection directly

## 📊 Monitoring

### Vercel Analytics

1. Go to **Analytics** in Vercel dashboard
2. Enable Vercel Analytics
3. Monitor performance and errors

### Logs

1. Go to **Functions** in Vercel dashboard
2. Click on a function to see logs
3. Use for debugging issues

## 🔄 Updates

To update the deployment:

```bash
# Make your changes
git add .
git commit -m "Update application"
git push origin main

# Vercel will automatically deploy
```

## 📞 Support

If you encounter issues:

1. Check logs in Vercel
2. Confirm all environment variables
3. Test locally first
4. Check [Vercel documentation](https://vercel.com/docs)
5. Open an issue on GitHub
