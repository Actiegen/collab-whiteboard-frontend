# 🎨 Collab Whiteboard

A real-time collaborative whiteboard application with chat, file sharing, and Google Authentication. Built with Next.js 14, TypeScript, Tailwind CSS, and integrated with Google Cloud services.

## ✨ Features

- **🎨 Real-time Collaborative Whiteboard**: Draw, sketch, and collaborate using [tldraw](https://tldraw.dev/)
- **💬 Live Chat**: Real-time messaging with file upload support
- **📁 File Sharing**: Upload and preview files in chat
- **👥 User Presence**: See who's online in each room
- **🔐 Google Authentication**: Secure login with Google OAuth
- **🌐 WebSocket Communication**: Real-time updates via WebSocket
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🏗️ Architecture

### Frontend (This Repository)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Whiteboard**: tldraw with real-time sync
- **State Management**: React Hooks
- **Deployment**: Vercel

### Backend
- **Repository**: [collab-whiteboard-backend](https://github.com/your-username/collab-whiteboard-backend)
- **Framework**: FastAPI (Python)
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **Real-time**: WebSocket connections
- **Deployment**: Google Cloud Run

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Project (for backend)
- Google OAuth credentials

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/collab-whiteboard-frontend.git
cd collab-whiteboard-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app/api/v1
NEXT_PUBLIC_WS_URL=wss://your-backend-url.run.app

# Debug Configuration
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 4. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/         # NextAuth.js routes
│   ├── dashboard/         # Main application page
│   ├── login/            # Login page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (redirect)
│   └── providers.tsx     # React context providers
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat components
│   └── whiteboard/       # Whiteboard components
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
└── lib/                  # Utility libraries
    └── config.ts         # Configuration constants
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Key Technologies

- **[Next.js 14](https://nextjs.org/)**: React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[NextAuth.js](https://next-auth.js.org/)**: Authentication for Next.js
- **[tldraw](https://tldraw.dev/)**: Collaborative whiteboard library
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)**: Real-time communication

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Vercel**: Import your repository in Vercel dashboard
3. **Configure Environment Variables**: Add all variables from `.env.local` to Vercel
4. **Update Google OAuth**: Add your Vercel domain to Google Cloud Console
5. **Deploy**: Vercel will automatically deploy on push

### Environment Variables for Production

```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=https://your-backend-url.run.app/api/v1
NEXT_PUBLIC_WS_URL=wss://your-backend-url.run.app
```

### Google Cloud Console Updates

Add these URLs to your Google OAuth configuration:

- **Authorized JavaScript origins**: `https://your-domain.vercel.app`
- **Authorized redirect URIs**: `https://your-domain.vercel.app/api/auth/callback/google`

## 🔗 Backend Repository

The backend API is hosted in a separate repository:

**[collab-whiteboard-backend](https://github.com/your-username/collab-whiteboard-backend)**

- FastAPI Python application
- Google Cloud Firestore database
- Google Cloud Storage for file uploads
- WebSocket real-time communication
- Deployed on Google Cloud Run

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-username/collab-whiteboard-frontend/issues) page
2. Review the [DEPLOYMENT.md](DEPLOYMENT.md) guide
3. Ensure all environment variables are properly configured
4. Verify Google OAuth settings match your deployment URLs

## 🎯 Roadmap

- [ ] Add more drawing tools and shapes
- [ ] Implement room permissions and access control
- [ ] Add file preview for more formats
- [ ] Implement user profiles and avatars
- [ ] Add export/import functionality for whiteboards
- [ ] Mobile app development
- [ ] Offline mode support
