import { OAuth2Client } from 'google-auth-library';
import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { GoogleApiConfig } from '@shared/schema';

interface GoogleUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: GoogleUser;
  googleConfig?: GoogleApiConfig;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor(private config: GoogleApiConfig) {
    this.oauth2Client = new OAuth2Client({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  /**
   * Verifies Google ID token and returns user information
   */
  async verifyToken(idToken: string): Promise<GoogleUser | null> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken,
        audience: this.config.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) return null;

      return {
        id: payload.sub,
        email: payload.email!,
        firstName: payload.given_name,
        lastName: payload.family_name,
        profileImageUrl: payload.picture,
      };
    } catch (error) {
      console.error('Error verifying Google token:', error);
      return null;
    }
  }

  /**
   * Generates Google OAuth URL for authentication
   */
  getAuthUrl(redirectUri: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      redirect_uri: redirectUri,
      prompt: 'consent', // Force consent screen
      include_granted_scopes: false // Don't include previously granted scopes
    });
  }

  /**
   * Exchanges authorization code for tokens
   */
  async getTokensFromCode(code: string, redirectUri: string) {
    const { tokens } = await this.oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    });
    return tokens;
  }
}

export function setupGoogleAuth(app: Express) {
  // Use memory store for sessions since we're going serverless
  const MemStore = MemoryStore(session);
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
  }));

  // Google OAuth login route
  app.post('/api/auth/google-config', (req, res) => {
    try {
      const { apiKey, clientId, clientSecret } = req.body;
      
      // Store config in session for this user
      (req.session as any).googleConfig = { apiKey, clientId, clientSecret };
      
      const authService = new GoogleAuthService({ apiKey, clientId, clientSecret });
      const authUrl = authService.getAuthUrl(`${req.protocol}://${req.get('host')}/api/auth/callback`);
      
      res.json({ authUrl });
    } catch (error) {
      res.status(400).json({ error: 'Invalid Google API configuration' });
    }
  });

  // Google OAuth callback route
  app.get('/api/auth/callback', async (req, res) => {
    try {
      const { code, error } = req.query;
      const googleConfig = (req.session as any).googleConfig;

      console.log('OAuth callback received:', { 
        hasCode: !!code, 
        hasError: !!error, 
        hasGoogleConfig: !!googleConfig,
        error: error,
        queryParams: req.query,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.log('OAuth error received:', error);
        return res.redirect('/?error=oauth_denied');
      }

      if (!googleConfig || !code) {
        console.log('Missing config or code in callback');
        return res.redirect('/?error=auth_failed');
      }

      const authService = new GoogleAuthService(googleConfig);
      const tokens = await authService.getTokensFromCode(
        code as string,
        `${req.protocol}://${req.get('host')}/api/auth/callback`
      );

      console.log('OAuth callback tokens received:', { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        scopes: tokens.scope,
        tokenPreview: tokens.access_token ? tokens.access_token.substring(0, 20) + '...' : 'none'
      });

      if (tokens.id_token) {
        const user = await authService.verifyToken(tokens.id_token);
        if (user) {
          (req.session as any).user = user;
          (req.session as any).googleTokens = tokens;
          
          console.log('User authenticated and tokens stored in session');
          
          // Check if we have a return URL from Gmail reauth
          const returnUrl = (req.session as any).postAuthReturnUrl;
          if (returnUrl) {
            console.log('Redirecting to return URL:', returnUrl);
            delete (req.session as any).postAuthReturnUrl;
            return res.redirect(returnUrl);
          }
          
          console.log('Redirecting to dashboard');
          return res.redirect('/dashboard');
        }
      }

      res.redirect('/?error=auth_failed');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Get current user route
  app.get('/api/auth/user', isAuthenticated as any, (req: any, res) => {
    res.json(req.user);
  });

  // Middleware to check if user has Google config
  app.get('/api/auth/status', (req, res) => {
    const user = (req.session as any).user;
    const googleConfig = (req.session as any).googleConfig;
    
    res.json({
      isAuthenticated: !!user,
      hasGoogleConfig: !!googleConfig,
      user: user || null,
    });
  });
}

// Middleware to ensure user is authenticated
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = (req.session as any).user;
  const googleConfig = (req.session as any).googleConfig;

  if (!user || !googleConfig) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  req.user = user;
  req.googleConfig = googleConfig;
  next();
};

// Middleware to inject Google Drive service
export const withGoogleDrive = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.googleConfig) {
    return res.status(401).json({ error: 'Google API configuration required' });
  }

  // Google Drive service will be available through the config
  next();
};