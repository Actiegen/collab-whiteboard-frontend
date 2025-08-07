# File Preview Troubleshooting Guide

## 🔍 Common Issues and Solutions

### 1. Images Not Loading

**Problem**: Images uploaded to Google Cloud Storage are not displaying in the chat.

**Possible Causes**:
- CORS configuration issues
- Incorrect image URLs
- Next.js Image component configuration
- Network connectivity issues

**Solutions**:

#### A. Check Next.js Image Configuration
Ensure your `next.config.ts` includes the correct domains:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'storage.googleapis.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.run.app',
      port: '',
      pathname: '/**',
    },
  ],
},
```

#### B. Verify Image URLs
Check the browser console for errors. Common issues:
- URLs are malformed
- CORS errors
- 404 errors

#### C. Test Image URLs Directly
Open the image URL in a new tab to verify it's accessible.

### 2. PDF Preview Issues

**Problem**: PDF files are not displaying in iframe.

**Solutions**:
- Check if the PDF URL is accessible
- Verify the PDF is publicly readable
- Try opening the PDF URL directly in browser

### 3. File Upload Issues

**Problem**: Files are not uploading or preview is not showing.

**Debug Steps**:
1. Check browser console for errors
2. Verify WebSocket connection is active
3. Check backend logs for upload errors
4. Verify file size limits

### 4. Production vs Development Differences

**Problem**: File preview works in development but not in production.

**Common Causes**:
- Environment variables not set in production
- Different CORS configurations
- Build optimization issues

**Solutions**:
1. Ensure all environment variables are set in Vercel
2. Check that Google Cloud Storage bucket is publicly accessible
3. Verify backend URL is correct in production

## 🛠️ Debugging Steps

### 1. Enable Debug Logging
Set these environment variables:
```env
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

### 2. Check Browser Console
Look for:
- Network errors
- CORS errors
- JavaScript errors
- Image loading errors

### 3. Test File Upload Process
1. Upload a small image file
2. Check the response from the backend
3. Verify the file URL is correct
4. Test the URL directly in browser

### 4. Verify Backend Configuration
Ensure the backend is:
- Properly configured for file uploads
- Returning correct URLs
- Setting proper CORS headers

## 📋 Checklist

- [ ] Next.js image domains configured correctly
- [ ] Google Cloud Storage bucket is public
- [ ] Backend file upload endpoint working
- [ ] WebSocket connection active
- [ ] Environment variables set correctly
- [ ] No CORS errors in console
- [ ] File URLs are accessible directly

## 🔧 Quick Fixes

### For Image Preview Issues:
1. Check `next.config.ts` image configuration
2. Verify image URLs are HTTPS
3. Test image URLs in new tab

### For PDF Preview Issues:
1. Check if PDF URL is accessible
2. Verify PDF is publicly readable
3. Try different PDF viewer approach

### For General File Issues:
1. Check browser console for errors
2. Verify WebSocket connection
3. Test with different file types
4. Check backend logs

## 📞 Getting Help

If issues persist:
1. Check the browser console for specific error messages
2. Verify all environment variables are set
3. Test file uploads with different file types
4. Check backend logs for errors
