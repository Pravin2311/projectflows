# URGENT: Fix redirect_uri_mismatch Error

## The Problem
Google OAuth requires the exact callback URL to be registered in Google Cloud Console. The platform is trying to use `/platform-oauth-callback` but it's not registered.

## The Solution
Add your current domain's callback URL to Google Cloud Console.

## Steps to Fix:

### 1. Get Your Current Replit URL
Look at your browser address bar. It should look like:
```
https://abc123-def456.replit.dev/projects/...
```

Your domain is: `https://abc123-def456.replit.dev`

### 2. Add Callback URL to Google Cloud Console
1. **Go to**: [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. **Click** on your OAuth 2.0 Client ID
3. **In "Authorized redirect URIs"**, click "ADD URI"
4. **Add this exact URL** (replace with your actual domain):
   ```
   https://YOUR-ACTUAL-REPL-URL.replit.dev/platform-oauth-callback
   ```
   
   For example, if your Replit URL is `https://abc123-def456.replit.dev`, then add:
   ```
   https://abc123-def456.replit.dev/platform-oauth-callback
   ```

5. **Click "Save"**

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