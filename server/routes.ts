import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Simple auth setup
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
import { aiService } from "./services/aiService";
// No Stripe imports needed - platform is completely free
import { insertProjectSchema, insertTaskSchema, insertCommentSchema } from "../shared/schema.js";
import { z } from "zod";
import { GoogleEmailService } from "./emailService";
import { GooglePeopleService } from "./services/googlePeopleService";
import { GoogleTasksService } from "./services/googleTasksService";
import { GoogleCalendarService } from "./services/googleCalendarService";

import session from 'express-session';

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup for simple auth
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Simple auth routes for development
  app.get('/api/auth/status', async (req: any, res) => {
    let hasGmailScope = false;
    let hasGoogleConfig = !!req.session?.googleConfig;
    
    // If authenticated but no Google config, check if user can inherit from any project
    if (req.session?.user && !hasGoogleConfig) {
      try {
        const userId = req.session.user.id;
        const projects = await storage.getUserProjects(userId);
        
        // Check if any project has Google configuration that user can inherit
        const projectWithConfig = projects.find(project => 
          project.googleApiConfig && project.ownerId !== userId
        );
        
        if (projectWithConfig) {
          // Auto-inherit configuration from first available project
          req.session.googleConfig = projectWithConfig.googleApiConfig;
          hasGoogleConfig = true;
        }
      } catch (error) {
        console.error('Error checking project configs:', error);
      }
    }
    
    // Check if we have access token and verify Gmail scope
    if (req.session?.googleTokens?.access_token) {
      try {
        console.log('Checking Gmail scope for token:', req.session.googleTokens.access_token.substring(0, 20) + '...');
        
        // Check if Gmail scope is present in token scope instead of API call
        const tokenScopes = req.session.googleTokens.scope || '';
        hasGmailScope = tokenScopes.includes('https://www.googleapis.com/auth/gmail.send');
        
        console.log('Gmail scope check - Token scopes:', tokenScopes);
        console.log('Gmail scope check - Has Gmail send scope:', hasGmailScope);
      } catch (error) {
        console.log('Gmail scope check failed:', error);
        hasGmailScope = false;
      }
    }
    
    res.json({
      isAuthenticated: !!req.session?.user,
      hasGoogleConfig,
      hasGmailScope,
      clientId: req.session?.googleConfig?.clientId, // Needed for popup OAuth
      user: req.session?.user || null
    });
  });

  // Exchange OAuth authorization code for access tokens
  app.post('/api/auth/exchange-oauth-code', async (req: any, res) => {
    if (!req.session?.googleConfig) {
      return res.status(401).json({ error: 'No Google config found' });
    }

    try {
      const { code } = req.body;
      const { clientId, clientSecret } = req.session.googleConfig;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }
      
      console.log('Exchanging OAuth code for tokens...');
      
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: 'postmessage', // Must match the redirect_uri used in authorization
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token exchange failed:', errorData);
        return res.status(400).json({ error: 'Failed to exchange code for tokens' });
      }

      const tokens = await tokenResponse.json();
      console.log('Successfully got tokens with scopes:', tokens.scope);
      
      // Store tokens in session
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        token_type: tokens.token_type || 'Bearer'
      };
      
      res.json(tokens);
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: 'Failed to exchange code for tokens' });
    }
  });

  // Check if user has valid Google tokens
  app.get('/api/auth/check-google-tokens', async (req: any, res) => {
    if (!req.session?.googleTokens) {
      return res.json({ hasValidTokens: false });
    }

    const tokens = req.session.googleTokens;
    const now = Date.now();
    
    // Check if tokens are still valid (not expired)
    if (tokens.expires_at && now > tokens.expires_at) {
      return res.json({ hasValidTokens: false });
    }

    res.json({
      hasValidTokens: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expires_in: Math.floor((tokens.expires_at - now) / 1000)
      }
    });
  });

  // Platform-managed OAuth URL generation (no user configuration required)
  app.post("/api/auth/platform-oauth-url", async (req: any, res) => {
    try {
      const { scopes } = req.body;
      
      // Environment-based OAuth credential selection
      const isProduction = process.env.NODE_ENV === 'production';
      const isDevelopment = !isProduction;
      
      // Use production or development credentials based on environment
      const PLATFORM_CLIENT_ID = isProduction 
        ? process.env.PLATFORM_GOOGLE_CLIENT_ID_PROD 
        : (process.env.PLATFORM_GOOGLE_CLIENT_ID || req.session.googleConfig?.clientId);
      
      if (!PLATFORM_CLIENT_ID) {
        const envType = isProduction ? 'Production' : 'Development';
        return res.status(400).json({ 
          error: `${envType} OAuth not configured`,
          environment: envType.toLowerCase(),
          hint: isDevelopment ? 'Using HTTP-enabled OAuth for development' : 'Requires HTTPS-only OAuth for production'
        });
      }
      
      console.log(`[${isProduction ? 'PROD' : 'DEV'}] Using OAuth Client ID: ${PLATFORM_CLIENT_ID.substring(0, 20)}...`);
      
      // Force HTTPS for production, but support HTTP for local development
      const protocol = req.get('host')?.includes('replit.dev') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${req.get('host')}/platform-oauth-callback`;
      
      const params = new URLSearchParams({
        client_id: PLATFORM_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        state: req.sessionID // Use session ID as state for security
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      console.log(`[${isProduction ? 'PROD' : 'DEV'}] Generated OAuth URL for redirect: ${redirectUri}`);
      
      res.json({ 
        authUrl,
        environment: isProduction ? 'production' : 'development',
        redirectUri,
        supportsHttp: isDevelopment
      });
    } catch (error) {
      console.error('Platform OAuth URL generation error:', error);
      res.status(500).json({ error: 'Failed to generate OAuth URL' });
    }
  });

  // Platform OAuth callback handler
  app.get("/platform-oauth-callback", async (req: any, res) => {
    try {
      const { code, error, state } = req.query;
      
      if (error) {
        return res.send(`
          <script>
            window.opener.postMessage({ error: '${error}' }, '*');
            window.close();
          </script>
        `);
      }

      if (!code) {
        return res.send(`
          <script>
            window.opener.postMessage({ error: 'No authorization code received' }, '*');
            window.close();
          </script>
        `);
      }

      // Environment-based credential selection for token exchange
      const isProduction = process.env.NODE_ENV === 'production';
      const PLATFORM_CLIENT_ID = isProduction 
        ? process.env.PLATFORM_GOOGLE_CLIENT_ID_PROD 
        : (process.env.PLATFORM_GOOGLE_CLIENT_ID || req.session.googleConfig?.clientId);
      const PLATFORM_CLIENT_SECRET = isProduction 
        ? process.env.PLATFORM_GOOGLE_CLIENT_SECRET_PROD 
        : (process.env.PLATFORM_GOOGLE_CLIENT_SECRET || req.session.googleConfig?.clientSecret);
      
      if (!PLATFORM_CLIENT_ID || !PLATFORM_CLIENT_SECRET) {
        return res.send(`
          <script>
            window.opener.postMessage({ error: 'OAuth credentials not configured' }, '*');
            window.close();
          </script>
        `);
      }
      
      // Force HTTPS for production, but support HTTP for local development
      const protocol = req.get('host')?.includes('replit.dev') ? 'https' : req.protocol;
      const redirectUri = `${protocol}://${req.get('host')}/platform-oauth-callback`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: PLATFORM_CLIENT_ID,
          client_secret: PLATFORM_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Platform token exchange failed:', error);
        return res.send(`
          <script>
            window.opener.postMessage({ error: 'Token exchange failed' }, '*');
            window.close();
          </script>
        `);
      }

      const tokens = await tokenResponse.json();
      
      // Store tokens in session
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        expires_at: Date.now() + (tokens.expires_in * 1000)
      };

      console.log(`✅ [${isProduction ? 'PROD' : 'DEV'}] Platform OAuth tokens successfully stored with scopes: ${tokens.scope}`);
      
      // Send tokens back to parent window
      res.send(`
        <script>
          window.opener.postMessage({ 
            success: true, 
            tokens: {
              access_token: '${tokens.access_token}',
              refresh_token: '${tokens.refresh_token}',
              scope: '${tokens.scope}',
              token_type: '${tokens.token_type}',
              expires_in: ${tokens.expires_in}
            }
          }, '*');
          window.close();
        </script>
      `);
    } catch (error) {
      console.error('Platform OAuth callback error:', error);
      res.send(`
        <script>
          window.opener.postMessage({ error: 'OAuth callback failed' }, '*');
          window.close();
        </script>
      `);
    }
  });

  // Update Google token from popup OAuth (legacy endpoint for compatibility)
  app.post('/api/auth/update-google-token', async (req: any, res) => {
    if (!req.session?.googleConfig) {
      return res.status(401).json({ error: 'No Google config found' });
    }

    try {
      const { accessToken, refreshToken, scope, expiresIn } = req.body;
      
      if (!accessToken || !scope) {
        return res.status(400).json({ error: 'Missing required token data' });
      }
      
      // Check if we have Gmail scope
      const hasGmailScope = scope.includes('https://www.googleapis.com/auth/gmail.send');
      
      // Update session with new token data
      req.session.googleTokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope: scope,
        expires_at: Date.now() + (expiresIn * 1000),
        token_type: 'Bearer'
      };
      
      console.log('Updated Google tokens with scopes:', scope);
      
      res.json({ 
        success: true, 
        hasGmailScope,
        scopes: scope.split(' ')
      });
    } catch (error) {
      console.error('Token update error:', error);
      res.status(400).json({ error: 'Failed to update token: ' + error });
    }
  });

  // Login routes - support both /api/login and /api/auth/login for compatibility
  app.get('/api/login', (req: any, res) => {
    // For development - just redirect back to home with setup flag
    res.redirect('/?setup=google');
  });

  app.get('/api/auth/login', (req: any, res) => {
    // For development - just redirect back to home with setup flag  
    res.redirect('/?setup=google');
  });

  app.post('/api/auth/google-config', async (req: any, res) => {
    try {
      const { apiKey, clientId, clientSecret } = req.body;
      
      // Simulate user creation for development
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@example.com',
        firstName: 'Development',
        lastName: 'User',
        profileImageUrl: undefined,
        subscriptionTier: 'free' as const
      };

      // Store in session
      req.session.googleConfig = { apiKey, clientId, clientSecret };
      req.session.user = mockUser;
      
      // Store in database
      await storage.upsertUser(mockUser);

      res.json({ success: true, user: mockUser });
    } catch (error) {
      console.error("Error setting up Google config:", error);
      res.status(500).json({ error: 'Failed to setup Google configuration' });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.session.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        res.status(500).json({ error: 'Failed to logout' });
      } else {
        res.json({ success: true });
      }
    });
  });

  // API configuration for user's own Google services
  app.post('/api/config/google', async (req: any, res) => {
    try {
      const { apiKey, clientId, clientSecret, geminiApiKey } = req.body;
      
      // Store Google config in session (including Gemini API key for AI-powered insights)
      req.session.googleConfig = { apiKey, clientId, clientSecret, geminiApiKey };
      
      res.json({ message: "Google configuration saved successfully" });
    } catch (error) {
      console.error('Error saving Google config:', error);
      res.status(500).json({ error: 'Failed to save Google configuration' });
    }
  });

  // New endpoint: Inherit Google configuration from project for team members
  app.post('/api/auth/inherit-project-config', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.body;
      const userId = req.session.user.id;
      
      // Check if user is a member of this project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ error: "Access denied to this project" });
      }
      
      // Get project with its Google configuration
      const project = await storage.getProject(projectId);
      if (!project || !project.googleApiConfig) {
        return res.status(404).json({ error: "Project Google configuration not found" });
      }
      
      // Inherit the project owner's Google config
      req.session.googleConfig = project.googleApiConfig;
      
      res.json({ 
        success: true, 
        message: "Inherited project Google configuration", 
        hasGoogleConfig: true 
      });
    } catch (error) {
      console.error('Error inheriting project config:', error);
      res.status(500).json({ error: 'Failed to inherit project configuration' });
    }
  });

  // Usage tracking for user's own API usage monitoring
  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const usage = await storage.getUserUsage(userId, currentMonth);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage data" });
    }
  });

  // Project routes
  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const googleConfig = req.session.googleConfig;
      
      const baseData = {
        ...req.body,
        ownerId: userId,
        allowedEmails: req.body.allowedEmails || [req.session.user.email], // Default to owner's email
      };
      
      const projectData = insertProjectSchema.parse(baseData);
      
      const project = await storage.createProject(projectData);
      
      // Store Google API configuration with the project for sharing with team members
      if (googleConfig) {
        await storage.updateProject(project.id, { googleApiConfig: googleConfig });
      }
      
      // Create activity
      await storage.createActivity({
        type: "project_created",
        description: `Created project "${project.name}"`,
        projectId: project.id,
        userId,
        entityId: project.id,
      });
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.id;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Project member routes
  app.get("/api/projects/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.id;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:id/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.id;
      const { email, role = "member" } = req.body;
      
      // Check if user is admin/owner
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership || !["owner", "admin"].includes(membership.role!)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Create invitation record with proper storage
      const invitationId = Math.random().toString(36).substring(2, 15);
      
      // Store invitation data for later acceptance
      const invitationData = {
        id: invitationId,
        projectId,
        email,
        role,
        inviterName: req.session.user?.firstName || req.session.user?.email || 'Team Member',
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      
      // Store invitation (using temporary in-memory storage for development)
      await storage.createInvitation(invitationData);
      
      // Send actual email invitation using Google Gmail API
      if (req.session?.googleTokens?.access_token) {
        try {
          const emailService = new GoogleEmailService(req.session.googleTokens.access_token);
          const project = await storage.getProject(projectId);
          const inviteLink = `${req.protocol}://${req.get('host')}/invite/${invitationId}`;
          
          await emailService.sendInvitationEmail({
            to: email,
            projectName: project?.name || 'Project',
            inviterName: req.session.user?.firstName || req.session.user?.email || 'Team Member',
            role: role,
            inviteLink: inviteLink
          });
          
          console.log(`✅ Email invitation sent to ${email} for project "${project?.name}"`);
        } catch (error) {
          console.error('❌ Failed to send email invitation:', error);
          // Continue with invitation creation even if email fails
        }
      } else {
        console.log(`📧 EMAIL INVITATION (Demo Mode - Gmail permissions needed):`);
        console.log(`   To: ${email}`);
        console.log(`   Project: ${projectId}`);
        console.log(`   Role: ${role}`);
        console.log(`   💡 Tip: Use "Re-authorize Gmail" button to enable real email sending`);
      }
      
      const member = await storage.addProjectMember({
        projectId,
        userId: email, // Use email as temporary ID until user joins
        role,
      });
      
      // Create activity
      await storage.createActivity({
        type: "member_added",
        description: `Invited ${email} to the project as ${role}`,
        projectId,
        userId,
        entityId: email,
      });
      
      res.json({ 
        success: true, 
        invitationId,
        message: `Invitation sent to ${email}`
      });
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
    }
  });

  // Invitation routes
  app.get("/api/invitations/:id", async (req: any, res) => {
    try {
      const invitationId = req.params.id;
      const invitation = await storage.getInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Get project details
      const project = await storage.getProject(invitation.projectId);
      
      res.json({
        id: invitation.id,
        projectId: invitation.projectId,
        projectName: project?.name || 'Project',
        inviterName: invitation.inviterName,
        role: invitation.role,
        email: invitation.email,
        status: invitation.status
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitations/:id/accept", async (req: any, res) => {
    try {
      const invitationId = req.params.id;
      const invitation = await storage.getInvitation(invitationId);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: "Invitation already processed" });
      }

      // Get the project to inherit Google configuration
      const project = await storage.getProject(invitation.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Create or get user record and session
      let user;
      try {
        user = await storage.getUser(invitation.email);
        if (!user) {
          // Create new user record
          user = await storage.upsertUser({
            id: invitation.email,
            email: invitation.email,
            firstName: invitation.email.split('@')[0], // Use part before @ as name
            lastName: ''
          });
          console.log(`✅ Created new user record for ${invitation.email}`);
        }
      } catch (error) {
        console.error('Error creating user record:', error);
        // Fallback to session-only user if storage fails
        user = {
          id: invitation.email,
          email: invitation.email,
          firstName: invitation.email.split('@')[0],
          lastName: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // Create user session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      };

      // Inherit project's Google configuration for seamless access
      if (project.googleApiConfig) {
        req.session.googleConfig = project.googleApiConfig;
        console.log(`✅ Inherited Google API configuration from project "${project.name}" for user ${invitation.email}`);
      }
      
      // Update the project member record to link the authenticated user
      // The member was already added during invitation creation with email as userId
      // Now we need to ensure the member record is properly linked
      try {
        const existingMember = await storage.getUserProjectRole(invitation.projectId, invitation.email);
        if (!existingMember) {
          // If no member record exists, create one
          await storage.addProjectMember({
            projectId: invitation.projectId,
            userId: invitation.email,
            role: invitation.role as "owner" | "admin" | "member",
          });
          console.log(`✅ Added project member record for ${invitation.email} in project "${project.name}"`);
        } else {
          console.log(`✅ Project member record already exists for ${invitation.email} in project "${project.name}"`);
        }
      } catch (error) {
        console.error('Error ensuring project member record:', error);
      }
      
      // Mark invitation as accepted
      await storage.updateInvitationStatus(invitationId, 'accepted');
      
      res.json({
        success: true,
        message: "Invitation accepted successfully",
        projectId: invitation.projectId,
        hasInheritedConfig: !!project.googleApiConfig
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Task routes
  app.post("/api/projects/:projectId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId,
        createdById: userId,
      });
      
      const task = await storage.createTask(taskData);
      
      // Create activity
      await storage.createActivity({
        type: "task_created",
        description: `Created task "${task.title}"`,
        projectId,
        userId,
        entityId: task.id,
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tasks = await storage.getProjectTasks(projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const taskId = req.params.id;
      
      console.log("Route: Received task update request for:", taskId, "with body:", req.body);
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log("Route: Found existing task:", task);
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(task.projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      const updatedTask = await storage.updateTask(taskId, updates);
      
      console.log("Route: Task updated successfully, sending response:", updatedTask);
      
      // Create activity for status changes
      if (updates.status && updates.status !== task.status) {
        await storage.createActivity({
          type: "task_status_changed",
          description: `Moved "${task.title}" to ${updates.status.replace('_', ' ')}`,
          projectId: task.projectId,
          userId,
          entityId: taskId,
          metadata: { 
            oldStatus: task.status, 
            newStatus: updates.status 
          },
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Comment routes
  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { taskId } = req.params;
      
      // Get the task to check project access
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(task.projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { taskId } = req.params;
      const { content, mentions = [], attachments = [], taskLinks = [] } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Get the task to check project access
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(task.projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comment = await storage.createComment({
        content: content.trim(),
        taskId,
        authorId: userId,
        mentions: mentions || [],
        attachments: attachments || [],
        taskLinks: taskLinks || [],
      });
      
      // Create activity
      await storage.createActivity({
        type: "comment_added",
        description: `Commented on task "${task.title}"`,
        projectId: task.projectId,
        userId,
        entityId: taskId,
      });
      
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get project members for mentions
  app.get("/api/projects/:projectId/members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { projectId } = req.params;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Activity routes
  app.get("/api/projects/:projectId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const activities = await storage.getProjectActivities(projectId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // AI routes
  app.post("/api/projects/:projectId/ai/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analysis = await aiService.analyzeProject(projectId);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing project:", error);
      res.status(500).json({ message: "Failed to analyze project" });
    }
  });

  app.get("/api/projects/:projectId/ai/suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const suggestions = await storage.getProjectAiSuggestions(projectId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      res.status(500).json({ message: "Failed to fetch AI suggestions" });
    }
  });

  app.post("/api/ai/task-suggestion", isAuthenticated, async (req: any, res) => {
    try {
      const { projectId, title } = req.body;
      
      if (!projectId || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
      }
      
      const suggestion = await aiService.generateTaskSuggestions(projectId, title);
      res.json({ suggestion });
    } catch (error) {
      console.error("Error generating task suggestion:", error);
      res.status(500).json({ message: "Failed to generate task suggestion" });
    }
  });

  // Dashboard stats route
  app.get("/api/projects/:projectId/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const projectId = req.params.projectId;
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const tasks = await storage.getProjectTasks(projectId);
      const members = await storage.getProjectMembers(projectId);
      
      const stats = {
        totalTasks: tasks.length,
        todoTasks: tasks.filter(t => t.status === 'todo').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length,
        teamMembers: members.length,
        highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({ message: "Failed to fetch project stats" });
    }
  });

  // Serve OAuth handler page
  app.get('/oauth-handler.html', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>OAuth Handler</title>
</head>
<body>
  <script>
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (window.opener) {
        if (error) {
          window.opener.postMessage({ error: error }, '*');
        } else if (code) {
          window.opener.postMessage({ code: code }, '*');
        }
        window.close();
      }
    } catch (e) {
      console.error('OAuth handler error:', e);
      if (window.opener) {
        window.opener.postMessage({ error: 'oauth_handler_error' }, '*');
        window.close();
      }
    }
  </script>
</body>
</html>`);
  });

  // Google People API routes
  app.get('/api/google/profile', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const peopleService = new GooglePeopleService(googleConfig, accessToken);
      const profile = await peopleService.getProfileInfo();
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.get('/api/google/contacts', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const peopleService = new GooglePeopleService(googleConfig, accessToken);
      
      let contacts;
      if (query) {
        contacts = await peopleService.searchContacts(query);
      } else {
        contacts = await peopleService.getContacts(limit);
      }
      
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  // Google Tasks API routes
  app.get('/api/google/tasklists', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const taskLists = await tasksService.getTaskLists();
      
      res.json(taskLists);
    } catch (error) {
      console.error('Error fetching task lists:', error);
      res.status(500).json({ error: 'Failed to fetch task lists' });
    }
  });

  app.post('/api/google/tasklists', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { title } = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Task list title is required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const taskList = await tasksService.createTaskList(title);
      
      if (!taskList) {
        return res.status(500).json({ error: 'Failed to create task list' });
      }

      res.json(taskList);
    } catch (error) {
      console.error('Error creating task list:', error);
      res.status(500).json({ error: 'Failed to create task list' });
    }
  });

  app.get('/api/google/tasklists/:tasklistId/tasks', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { tasklistId } = req.params;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const tasks = await tasksService.getTasks(tasklistId);
      
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.post('/api/google/tasklists/:tasklistId/tasks', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { tasklistId } = req.params;
      const taskData = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const task = await tasksService.createTask(tasklistId, taskData);
      
      if (!task) {
        return res.status(500).json({ error: 'Failed to create task' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.post('/api/google/tasklists/:tasklistId/tasks/:taskId/complete', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { tasklistId, taskId } = req.params;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const task = await tasksService.completeTask(tasklistId, taskId);
      
      if (!task) {
        return res.status(500).json({ error: 'Failed to complete task' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error completing task:', error);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  });

  app.post('/api/projects/:projectId/sync-google-tasks', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { projectId } = req.params;
      const { tasklistId } = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      if (!tasklistId) {
        return res.status(400).json({ error: 'Task list ID is required' });
      }

      const tasksService = new GoogleTasksService(googleConfig, accessToken);
      const projectTasks = await storage.getProjectTasks(projectId);
      
      const syncResults = await Promise.all(
        projectTasks.map(task => tasksService.syncProjectTask(tasklistId, task))
      );

      const syncedCount = syncResults.filter(result => result !== null).length;
      
      res.json({ 
        message: `Synced ${syncedCount} tasks to Google Tasks`,
        syncedTasks: syncedCount
      });
    } catch (error) {
      console.error('Error syncing tasks:', error);
      res.status(500).json({ error: 'Failed to sync tasks' });
    }
  });

  // Google Calendar API routes
  app.get('/api/google/calendars', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const calendars = await calendarService.getCalendars();
      
      res.json(calendars);
    } catch (error) {
      console.error('Error fetching calendars:', error);
      res.status(500).json({ error: 'Failed to fetch calendars' });
    }
  });

  app.get('/api/google/calendars/:calendarId/events', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { calendarId } = req.params;
      const { timeMin, timeMax } = req.query;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const events = await calendarService.getEvents(
        calendarId === 'primary' ? 'primary' : calendarId,
        timeMin as string,
        timeMax as string
      );
      
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  app.post('/api/google/calendars/:calendarId/events', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { calendarId } = req.params;
      const eventData = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const event = await calendarService.createEvent(
        calendarId === 'primary' ? 'primary' : calendarId,
        eventData
      );
      
      if (!event) {
        return res.status(500).json({ error: 'Failed to create event' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  app.post('/api/projects/:projectId/calendar/milestone', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { projectId } = req.params;
      const milestoneData = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const event = await calendarService.createProjectMilestone(project.name, milestoneData);
      
      if (!event) {
        return res.status(500).json({ error: 'Failed to create milestone event' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ error: 'Failed to create milestone' });
    }
  });

  app.post('/api/projects/:projectId/calendar/meeting', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { projectId } = req.params;
      const meetingData = req.body;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const event = await calendarService.createTeamMeeting(project.name, meetingData);
      
      if (!event) {
        return res.status(500).json({ error: 'Failed to create meeting event' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ error: 'Failed to create meeting' });
    }
  });

  app.get('/api/projects/:projectId/calendar/deadlines', async (req: any, res) => {
    try {
      const googleConfig = req.session.googleConfig;
      const accessToken = req.session.googleTokens?.access_token;
      const { projectId } = req.params;
      const { daysAhead } = req.query;
      
      if (!googleConfig || !accessToken) {
        return res.status(401).json({ error: 'Google authentication required' });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const calendarService = new GoogleCalendarService(googleConfig, accessToken);
      const deadlines = await calendarService.getProjectDeadlines(
        project.name,
        daysAhead ? parseInt(daysAhead as string) : 30
      );
      
      res.json(deadlines);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      res.status(500).json({ error: 'Failed to fetch deadlines' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
