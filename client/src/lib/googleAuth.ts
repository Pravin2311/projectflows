// Universal Google OAuth that works on any domain
// Uses popup-based flow to avoid redirect URI configuration issues

interface GoogleUser {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
}

interface GoogleAuth {
  signIn: (options: any) => Promise<any>;
  isSignedIn: { get: () => boolean };
  currentUser: { get: () => any };
}

interface GoogleAPI {
  load: (api: string, callback: () => void) => void;
  auth2: {
    init: (config: any) => Promise<GoogleAuth>;
    getAuthInstance: () => GoogleAuth;
  };
}

declare global {
  interface Window {
    gapi: GoogleAPI;
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
      // Load Google API script
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('auth2', () => {
            window.gapi.auth2.init({
              client_id: this.clientId,
            }).then(() => {
              this.initiated = true;
              resolve();
            }).catch(reject);
          });
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: this.clientId,
          }).then(() => {
            this.initiated = true;
            resolve();
          }).catch(reject);
        });
      }
    });
  }

  async signInWithPopup(): Promise<GoogleUser> {
    await this.initGoogleAPI();
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    const googleUser = await authInstance.signIn({
      scope: this.scopes.join(' '),
      prompt: 'consent', // Force consent screen
    });

    const authResponse = googleUser.getAuthResponse(true);
    
    return {
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
      scope: authResponse.scope,
      token_type: authResponse.token_type || 'Bearer',
      expires_in: authResponse.expires_in,
    };
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