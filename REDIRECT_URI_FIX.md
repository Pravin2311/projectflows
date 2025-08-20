# URGENT: Fix redirect_uri_mismatch Error

## Current Error Analysis
From your error screenshot, Google is expecting this redirect URI:
```
http://5b5f8299-7c4a-4f25-b4fb-278dcff8b581-00-xwv50dvel03x.kirk.replit.dev/platform-oauth-callback
```

## Quick Fix - Add BOTH URLs to Google Cloud Console

You need to add BOTH HTTP and HTTPS versions:

### 1. Add These Exact URLs to Google Cloud Console
1. **Go to**: [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. **Click** on your OAuth 2.0 Client ID
3. **In "Authorized redirect URIs"**, add BOTH of these:

   ```
   http://5b5f8299-7c4a-4f25-b4fb-278dcff8b581-00-xwv50dvel03x.kirk.replit.dev/platform-oauth-callback
   ```
   
   ```
   https://5b5f8299-7c4a-4f25-b4fb-278dcff8b581-00-xwv50dvel03x.kirk.replit.dev/platform-oauth-callback
   ```

4. **Click "Save"**

### 3. Test Again
After saving in Google Cloud Console:
1. Go back to your project page
2. Click "Enable Email Invites"
3. OAuth should now work without the redirect_uri_mismatch error

## For Production Deployment
When you deploy to production, add your production domain's callback URL:
```
https://yourdomain.com/platform-oauth-callback
```

## Why This Happens
Google OAuth security requires pre-registration of all callback URLs to prevent unauthorized redirects. Each deployment domain needs its callback URL registered once.