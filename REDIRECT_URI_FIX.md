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

### 3. Configure OAuth Consent Screen (CRITICAL)
After adding redirect URIs, you must also configure the OAuth Consent Screen:

1. **Go to Google Cloud Console** → **OAuth consent screen**
2. **Choose "External"** and fill in:
   - App name: "ProjectFlow" 
   - User support email: Your email
   - Developer contact: Your email
3. **Add these exact scopes**:
   ```
   https://www.googleapis.com/auth/userinfo.profile
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/drive
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/gmail.send
   ```
4. **Add yourself as a test user**

### 4. Test Again
After completing both redirect URIs AND consent screen:
1. Go back to your project page  
2. Click "Enable Email Invites"
3. OAuth should now work completely

## Common OAuth Errors:
- `redirect_uri_mismatch` = Add callback URL to Credentials
- `access_denied` = Configure OAuth Consent Screen + Add test users  
- `Access blocked` = Add yourself as test user in OAuth consent screen
- `invalid_client` = Check Client ID/Secret match

## Critical Final Step - Add Test User:
If you see "Access blocked" message:
1. Go to Google Cloud Console → OAuth consent screen
2. Scroll to "Test users" section → ADD USERS
3. Add your email address: `mydomain2311@gmail.com`
4. Save and try OAuth again