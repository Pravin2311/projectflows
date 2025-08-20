// Simplified Google OAuth using direct OAuth flow
// Works around Google API initialization issues by using direct OAuth URLs

interface GoogleUser {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

export class SimpleGoogleAuth {
  private clientId: string;
  private scopes: string[];

  constructor(clientId: string, scopes: string[]) {
    this.clientId = clientId;
    this.scopes = scopes;
  }

  async signInWithPopup(): Promise<GoogleUser> {
    console.log('Starting direct OAuth flow with scopes:', this.scopes);
    
    if (!this.clientId) {
      throw new Error('Google Client ID not provided');
    }

    return new Promise((resolve, reject) => {
      // Create OAuth URL with proper redirect URI
      const redirectUri = `${window.location.origin}/oauth-handler.html`;
      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: redirectUri,
        scope: this.scopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('Opening OAuth popup with URL:', authUrl);

      // Open popup window
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked by browser. Please enable popups and try again.'));
        return;
      }

      // Listen for messages from popup
      const messageListener = async (event: MessageEvent) => {
        // Accept messages from our own domain (OAuth handler page)
        if (event.origin !== window.location.origin) {
          return;
        }

        console.log('Received message from OAuth popup:', event.data);

        if (event.data && typeof event.data === 'object') {
          window.removeEventListener('message', messageListener);
          
          if (event.data.error) {
            popup.close();
            reject(new Error(`OAuth failed: ${event.data.error}`));
            return;
          }

          if (event.data.code) {
            popup.close();
            
            try {
              // Exchange code for tokens using our backend
              const response = await fetch('/api/auth/exchange-oauth-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: event.data.code }),
                credentials: 'include'
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token exchange failed: ${errorText}`);
              }

              const tokens = await response.json();
              console.log('Successfully exchanged code for tokens');
              
              resolve({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                scope: tokens.scope,
                token_type: tokens.token_type || 'Bearer',
                expires_in: tokens.expires_in
              });
            } catch (error: any) {
              console.error('Token exchange failed:', error);
              reject(new Error(`Token exchange failed: ${error.message}`));
            }
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
          reject(new Error('OAuth popup was closed by user'));
        }
      }, 1000);
    });
  }

  async getExistingToken(): Promise<GoogleUser | null> {
    // For the direct OAuth flow, we'll rely on server-side session tokens
    // This method can be used to check if user has existing valid tokens
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

export const createGoogleAuth = (clientId: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send'
  ];
  
  return new SimpleGoogleAuth(clientId, scopes);
};