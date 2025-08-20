// Universal Google OAuth using Google Identity Services
// Works on any domain without manual redirect URI configuration

interface GoogleUser {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: any) => any;
        };
      };
    };
  }
}

export class UniversalGoogleAuth {
  private clientId: string;
  private scopes: string[];
  private codeClient: any = null;

  constructor(clientId: string, scopes: string[]) {
    this.clientId = clientId;
    this.scopes = scopes;
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        // Wait a moment for the Google object to be fully initialized
        setTimeout(() => {
          if (window.google?.accounts?.oauth2) {
            resolve();
          } else {
            reject(new Error('Google Identity Services failed to load'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async signInWithPopup(): Promise<GoogleUser> {
    console.log('Starting Google Identity Services OAuth with scopes:', this.scopes);
    
    if (!this.clientId) {
      throw new Error('Google Client ID not provided');
    }

    await this.loadGoogleIdentityServices();

    return new Promise((resolve, reject) => {
      try {
        // Initialize the code client
        this.codeClient = window.google.accounts.oauth2.initCodeClient({
          client_id: this.clientId,
          scope: this.scopes.join(' '),
          ux_mode: 'popup',
          callback: async (response: any) => {
            console.log('Google OAuth response:', response);
            
            if (response.error) {
              reject(new Error(`OAuth failed: ${response.error}`));
              return;
            }

            if (response.code) {
              try {
                // Exchange code for tokens using our backend
                const tokenResponse = await fetch('/api/auth/exchange-oauth-code', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ code: response.code }),
                  credentials: 'include'
                });

                if (!tokenResponse.ok) {
                  const errorText = await tokenResponse.text();
                  throw new Error(`Token exchange failed: ${errorText}`);
                }

                const tokens = await tokenResponse.json();
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
            }
          },
        });

        // Request the authorization code
        this.codeClient.requestCode();
      } catch (error: any) {
        console.error('Google OAuth initialization failed:', error);
        reject(new Error(`Google OAuth failed: ${error.message}`));
      }
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

export const createGoogleAuth = (clientId: string) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email', 
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send'
  ];
  
  return new UniversalGoogleAuth(clientId, scopes);
};