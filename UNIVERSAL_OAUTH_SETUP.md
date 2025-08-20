# Universal OAuth Setup Guide

## Problem Solved

The original Gmail setup required users to manually configure redirect URIs in Google Cloud Console for every deployment URL. This created a major barrier for end users.

## Universal Solution

This new implementation uses **popup-based OAuth** that works on any domain without manual configuration.

## Benefits for End Users

✅ **Zero Configuration**: Works on localhost, Replit, Vercel, Netlify, any custom domain  
✅ **No Google Cloud Console Setup**: Users never need to touch redirect URI settings  
✅ **One-Time Setup**: Configure OAuth app once, works everywhere  
✅ **Better UX**: Popup window instead of page redirects  

## Google Cloud Setup (One Time Only)

1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Create OAuth 2.0 Client ID** with these settings:
   - Application type: **Web application**  
   - Authorized redirect URIs: Add `postmessage` (this special URI works universally)
3. **Enable APIs**: Gmail API, Google Drive API
4. **Get credentials**: Client ID, Client Secret, API Key

**Key Benefit**: Just add `postmessage` as the redirect URI - it works on any domain automatically without needing specific URLs.

## How It Works

- Uses Google Identity Services library (modern, official solution)
- Automatic domain handling - no redirect URI configuration needed
- Backend exchanges authorization code for access tokens  
- Stores tokens securely in server session
- Works reliably across all domains and deployment environments

## Technical Details

- **Frontend**: Google JavaScript API with popup window
- **Backend**: Token validation and session management  
- **Security**: Tokens stored in secure HTTP-only session cookies
- **Scope Management**: Automatic checking for required Gmail permissions

## User Experience

1. Click "Enable Email Invites"
2. Popup window opens with Google's permission screen
3. User grants permissions in popup
4. Popup closes, main window shows "Gmail Enabled"
5. Email invitations now work with real Gmail delivery

No redirect URIs, no manual configuration, works everywhere!