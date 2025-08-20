// Platform-Managed Google OAuth
// Users never need to configure Google Cloud Console

interface GoogleUser {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

export class PlatformManagedAuth {
  private scopes: string[];

  constructor(scopes: string[]) {
    this.scopes = scopes;
  }

  async signInWithPopup(): Promise<GoogleUser> {
    console.log('Starting platform-managed OAuth with scopes:', this.scopes);
    
    // Use platform's OAuth credentials - no user setup required
    const response = await fetch('/api/auth/platform-oauth-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes: this.scopes }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get OAuth URL from platform');
    }

    const { authUrl } = await response.json();

    return new Promise((resolve, reject) => {
      // Open popup window
      const popup = window.open(
        authUrl,
        'platform-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked by browser. Please enable popups and try again.'));
        return;
      }

      // Listen for messages from popup
      const messageListener = async (event: MessageEvent) => {
        // Accept messages from our own domain
        if (event.origin !== window.location.origin) {
          return;
        }

        console.log('Received OAuth message:', event.data);

        if (event.data && typeof event.data === 'object') {
          window.removeEventListener('message', messageListener);
          
          if (event.data.error) {
            popup.close();
            reject(new Error(`OAuth failed: ${event.data.error}`));
            return;
          }

          if (event.data.success && event.data.tokens) {
            popup.close();
            console.log('Platform OAuth successful');
            
            resolve({
              access_token: event.data.tokens.access_token,
              refresh_token: event.data.tokens.refresh_token,
              scope: event.data.tokens.scope,
              token_type: event.data.tokens.token_type || 'Bearer',
              expires_in: event.data.tokens.expires_in
            });
            return;
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('Gmail connection cancelled. Click "Connect Gmail" to try again.'));
        }
      }, 1000);
    });
  }

  async getExistingToken(): Promise<GoogleUser | null> {
    try {
      const response = await fetch('/api/auth/check-google-tokens', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasValidTokens) {
          return data.tokens;
        }
      }
    } catch (error) {
      console.log('No existing tokens found:', error);
    }
    
    return null;
  }
}

export const createGoogleAuth = () => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  return new PlatformManagedAuth(scopes);
};