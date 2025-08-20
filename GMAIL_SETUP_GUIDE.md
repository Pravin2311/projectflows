# Gmail Email Invitations Setup Guide

## Complete Setup Process

### 1. Google API Credentials Setup
First, you need Google API credentials:

**Get Your Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google Drive API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `https://your-replit-domain.replit.app/api/auth/callback`
6. Get your Client ID, Client Secret
7. Also get an API Key from "Create Credentials" → "API Key"

### 2. Initial Authentication
1. In your ProjectFlow dashboard, enter:
   - Google API Key
   - Google Client ID  
   - Google Client Secret
2. Click "Authenticate with Google"
3. Complete basic Google login

### 3. Enable Gmail Permissions
1. Go to any project
2. Click "Invite Team"
3. You'll see orange "Enable Email Invites" button
4. Click it → redirected to Google permissions
5. Grant permissions for:
   - ✅ Google Drive access
   - ✅ Gmail sending permissions  
   - ✅ Profile access
6. Click "Allow"
7. Redirected back to your project

### 4. Send Real Email Invitations
1. Click "Invite Team"
2. Enter any email address (Gmail, Yahoo, corporate, etc.)
3. Select role (member/admin)
4. Click "Send Invitation"
5. ✅ Real email delivered via Google Gmail API!

## Troubleshooting

**Issue: Still seeing "Demo Mode"**
- Check server logs for Gmail scope verification
- Ensure you clicked "Allow" for all permissions on Google
- Try the "Enable Email Invites" button again

**Issue: Redirected to dashboard instead of project**
- This is expected behavior - navigate back to your project
- Gmail permissions are now active for all projects

**Issue: No email received**
- Check spam/junk folder
- Verify Gmail permissions were granted (no "Enable Email Invites" button should show)
- Check server logs for delivery confirmation

## Technical Details

The system uses:
- **Google OAuth 2.0** for permission granting
- **Gmail API** for real email sending (not SMTP)
- **Your Google account** as the sender (maintains free architecture)
- **Professional templates** with project branding
- **Universal delivery** to any email provider worldwide

All emails are sent from your Google account via the Gmail API, maintaining the completely free platform approach.