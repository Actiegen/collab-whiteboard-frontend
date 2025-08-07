# Deployment Guide for Vercel

## 📋 Pre-deployment Checklist

### 1. Configure Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret-key

# Google OAuth Configuration  
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://collab-whiteboard-backend-570131883677.us-east1.run.app/api/v1
NEXT_PUBLIC_WS_URL=wss://collab-whiteboard-backend-570131883677.us-east1.run.app

# Debug Configuration (optional for production)
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=error
```

### 2. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### 3. Update Google OAuth Configuration

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to "APIs & Services" > "Credentials"
2. Edit your OAuth 2.0 Client ID
3. Add these to **Authorized JavaScript origins**:
   - `https://your-vercel-domain.vercel.app`
   
4. Add these to **Authorized redirect URIs**:
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google`

### 4. Deploy

After configuring the environment variables:

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy automatically

## 🔧 Troubleshooting

### Common Issues:

1. **NextAuth Error: Invalid URL**
   - Check that `NEXTAUTH_URL` matches your Vercel domain exactly

2. **Google OAuth Error: redirect_uri_mismatch**
   - Verify redirect URIs in Google Cloud Console match your Vercel domain

3. **Missing Environment Variables**
   - All variables must be set in Vercel dashboard, not just in `.env.local`

4. **WebSocket Connection Issues**
   - Ensure `NEXT_PUBLIC_WS_URL` is accessible from the browser
   - Check CORS configuration on the backend

## ✅ Verification

After deployment, test:

1. Visit your Vercel URL
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect to dashboard
5. Test WebSocket connection to backend
