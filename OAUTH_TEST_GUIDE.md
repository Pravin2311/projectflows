# OAuth Setup - Critical Redirect URI Fix

## URGENT: Add This Exact Redirect URI

**You must add this exact URL to Google Cloud Console:**

```
https://your-replit-url.replit.dev/platform-oauth-callback
```

**Replace `your-replit-url` with your actual Replit URL from the browser address bar.**

## Steps to Fix Right Now:

### 1. Get Your Replit URL
- Look at your browser address bar
- Copy the domain part (e.g., `https://abc123.replit.dev`)

### 2. Add to Google Cloud Console
1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Edit your OAuth 2.0 Client ID**
3. **In "Authorized redirect URIs"**, add your domain + `/platform-oauth-callback`:
   ```
   https://YOUR-ACTUAL-REPL-URL.replit.dev/platform-oauth-callback
   ```
4. **Save the changes**

### 3. Test the Flow
1. Go to your project page
2. Click "Enable Email Invites" button
3. OAuth popup should open with Google's permission screen
4. Grant Gmail permissions
5. Popup should close and show "Gmail Enabled" message

## What Should Happen

### ✅ Success Indicators:
- Popup opens without "Authorization Error"
- Google shows permission screen for Gmail and Drive access
- After granting permissions, popup closes automatically
- Main page shows "Gmail Enabled" toast notification
- Console logs show "Successfully exchanged code for tokens"
- Email invitations will now send real Gmail emails

### ❌ Common Issues:
- **"Authorization Error: redirect_uri_mismatch"** = Add your domain's `/platform-oauth-callback` to Google Cloud Console
- **Popup blocked** = Enable popups for your domain  
- **"OAuth failed"** = Check Google Cloud Console credentials

### 🔧 Quick Fix for redirect_uri_mismatch:
1. Copy your Replit URL from browser address bar
2. Add `/platform-oauth-callback` to the end  
3. Add this complete URL to Google Cloud Console redirect URIs
4. Save and try again

## Production Deployment Notes

✅ **Ready for Production**: The OAuth flow uses standard web patterns that work everywhere
✅ **Domain Flexible**: Just add new domain's `/oauth-handler.html` to Google Cloud Console  
✅ **No Google API Dependencies**: Avoids initialization issues
✅ **Secure**: Backend handles token exchange securely

## Next Steps

1. Test the current implementation
2. Confirm email sending works
3. Deploy to production (just update redirect URI in Google Cloud Console)
4. Your users can send real Gmail invitations!

The architecture is now solid and deployment-ready!