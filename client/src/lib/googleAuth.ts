// Universal Google OAuth that works on any domain
// Uses popup-based flow to avoid redirect URI configuration issues

interface GoogleUser {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      auth2: {
        init: (config: any) => Promise<any>;
        getAuthInstance: () => any;
      };
    };
  }
}

export class UniversalGoogleAuth {
  private clientId: string;
  private scopes: string[];
  private initiated = false;

  constructor(clientId: string, scopes: string[]) {
    this.clientId = clientId;
    this.scopes = scopes;
  }

  async initGoogleAPI(): Promise<void> {
    if (this.initiated) return;

    return new Promise((resolve, reject) => {
      console.log('Initializing Google API with client ID:', this.clientId);
      
      if (!this.clientId) {
        reject(new Error('Google Client ID not provided'));
        return;
      }

      // Load Google API script
      if (!window.gapi) {
        console.log('Loading Google API script...');
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          console.log('Google API script loaded, initializing auth2...');
          window.gapi.load('auth2', () => {
            console.log('Auth2 loaded, initializing with client ID...');
            window.gapi.auth2.init({
              client_id: this.clientId,
            }).then(() => {
              console.log('Google Auth2 initialized successfully');
              this.initiated = true;
              resolve();
            }).catch((error: any) => {
              console.error('Google Auth2 initialization failed:', error);
              reject(new Error(`Google Auth2 initialization failed: ${error.error || error.message || String(error)}`));
            });
          });
        };
        script.onerror = (error) => {
          console.error('Failed to load Google API script:', error);
          reject(new Error('Failed to load Google API script'));
        };
        document.head.appendChild(script);
      } else {
        console.log('Google API already loaded, initializing auth2...');
        window.gapi.load('auth2', () => {
          console.log('Auth2 loaded, initializing with client ID...');
          window.gapi.auth2.init({
            client_id: this.clientId,
          }).then(() => {
            console.log('Google Auth2 initialized successfully');
            this.initiated = true;
            resolve();
          }).catch((error: any) => {
            console.error('Google Auth2 initialization failed:', error);
            reject(new Error(`Google Auth2 initialization failed: ${error.error || error.message || String(error)}`));
          });
        });
      }
    });
  }

  async signInWithPopup(): Promise<GoogleUser> {
    console.log('Starting popup sign-in with scopes:', this.scopes);
    await this.initGoogleAPI();
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    console.log('Got auth instance, attempting sign in...');
    
    try {
      const googleUser = await authInstance.signIn({
        scope: this.scopes.join(' '),
        prompt: 'consent', // Force consent screen
      });

      console.log('Google user signed in:', googleUser);
      const authResponse = googleUser.getAuthResponse(true);
      console.log('Auth response:', authResponse);
      
      if (!authResponse.access_token) {
        throw new Error('No access token received from Google');
      }
      
      return {
        access_token: authResponse.access_token,
        refresh_token: authResponse.refresh_token,
        scope: authResponse.scope,
        token_type: authResponse.token_type || 'Bearer',
        expires_in: authResponse.expires_in,
      };
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      throw new Error(`Google sign-in failed: ${error.error || error.message || String(error)}`);
    }
  }

  async getExistingToken(): Promise<GoogleUser | null> {
    try {
      await this.initGoogleAPI();
      const authInstance = window.gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();
      
      if (isSignedIn) {
        const googleUser = authInstance.currentUser.get();
        const authResponse = googleUser.getAuthResponse(true);
        
        // Check if we have the required scopes
        const grantedScopes = authResponse.scope.split(' ');
        const hasAllScopes = this.scopes.every(scope => grantedScopes.includes(scope));
        
        if (hasAllScopes) {
          return {
            access_token: authResponse.access_token,
            refresh_token: authResponse.refresh_token,
            scope: authResponse.scope,
            token_type: authResponse.token_type || 'Bearer',
            expires_in: authResponse.expires_in,
          };
        }
      }
    } catch (error) {
      console.log('No existing Google auth found:', error);
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