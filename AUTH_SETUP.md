# Google Authentication Setup

## 1. Configure Google OAuth

### 1.1 Create project in Google Cloud Console
1. Access [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 1.2 Configure OAuth 2.0
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure:
   - Application type: Web application
   - Name: Collab Whiteboard
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 1.3 Get credentials
- Copy the **Client ID** and **Client Secret**

## 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## 3. Configure for production

For production deployment, update the authorized URLs in Google Cloud Console:
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`

And update the `.env.local`:
```env
NEXTAUTH_URL=https://your-domain.com
```

## 4. Test

1. Run `npm run dev`
2. Access `http://localhost:3000`
3. Click "Sign in with Google"
4. Login with your Google account

## 5. Next steps

- [ ] Implement access control in backend
- [ ] Add JWT token validation
- [ ] Implement online users list via WebSocket
- [ ] Add file access control
