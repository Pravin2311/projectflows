# Production OAuth Solution - Custom Domain + HTTPS

## Problem Confirmed ✅
Google requires **HTTPS-only redirect URIs** for production OAuth apps. Mixed HTTP/HTTPS URIs prevent publishing to production.

**Current Issue**: Using both:
- `http://localhost:*` (blocks production publishing)
- `https://*.replit.dev` (allowed for production)

## Complete Solution Path

### Step 1: Deploy with Custom Domain (Replit Feature)
Replit provides **automatic HTTPS** with custom domains:

1. **Deploy your app**: Use Replit Deployments (Autoscale/Reserved VM)
2. **Add custom domain**: In Deployments → Settings → "Link a domain"
3. **Automatic SSL**: Replit provides TLS/SSL certificates automatically
4. **Result**: `https://projectflow.app` (fully HTTPS)

### Step 2: Create Production OAuth App
Once you have HTTPS custom domain:

1. **Create new OAuth app** in Google Cloud Console
2. **Add HTTPS-only redirect URIs**:
   ```
   https://projectflow.app/platform-oauth-callback
   https://*.replit.dev/platform-oauth-callback
   ```
3. **Publish to production** (now allowed with HTTPS-only URIs)
4. **Update environment variables** with production OAuth credentials

### Step 3: Environment-Based OAuth Selection
```typescript
// Use production OAuth for deployed environments
// Keep development OAuth for local development
const oauthCredentials = process.env.NODE_ENV === 'production' 
  ? {
      clientId: process.env.PLATFORM_GOOGLE_CLIENT_ID_PROD,
      clientSecret: process.env.PLATFORM_GOOGLE_CLIENT_SECRET_PROD
    }
  : {
      clientId: process.env.PLATFORM_GOOGLE_CLIENT_ID_DEV,
      clientSecret: process.env.PLATFORM_GOOGLE_CLIENT_SECRET_DEV
    };
```

## Expected Results After Implementation

### For End Users:
✅ Click "Connect Gmail (1-Click)"  
✅ Google OAuth popup appears (no test user restrictions)  
✅ Grant permissions  
✅ Done - email invitations work immediately  
✅ Zero technical configuration required  

### For Platform:
✅ Production OAuth app published and approved  
✅ Professional custom domain with automatic HTTPS  
✅ No test user limitations  
✅ Scalable for unlimited users  
✅ Maintains completely free core offering  

## Implementation Steps

### Immediate Actions:
1. **Deploy to Replit** with custom domain
2. **Configure custom domain** in Replit Deployments
3. **Create production OAuth app** with HTTPS-only URIs
4. **Publish OAuth app** to production (now possible)
5. **Update environment variables** for production

### Development Workflow:
- **Local**: Keep existing HTTP-enabled OAuth app
- **Production**: Use new HTTPS-only OAuth app
- **Environment detection**: Automatically select correct OAuth app

This solves the fundamental Google OAuth production publishing blocker!