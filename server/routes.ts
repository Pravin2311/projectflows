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
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - subscription features will be limited');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
import { insertProjectSchema, insertTaskSchema, insertCommentSchema } from "../shared/schema.js";
import { z } from "zod";

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
  app.get('/api/auth/status', (req: any, res) => {
    res.json({
      isAuthenticated: !!req.session?.user,
      hasGoogleConfig: !!req.session?.googleConfig,
      user: req.session?.user || null
    });
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

  // Subscription routes - Stripe based
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      const plans = [
        {
          id: 'free',
          name: 'Free',
          amount: 0,
          currency: 'USD',
          interval: 'monthly',
          features: [
            'Unlimited projects in your Google Drive',
            'Basic kanban boards',
            'Team collaboration',
            'Your own Google API keys required'
          ]
        },
        {
          id: 'premium',
          name: 'Premium',
          amount: 1900, // $19.00 in cents
          currency: 'USD',
          interval: 'monthly',
          features: [
            'Everything in Free',
            'Advanced AI insights with Gemini',
            'Custom automations and workflows',
            'Advanced reporting and analytics',
            'Priority support with direct access',
            'Early access to new features'
          ]
        }
      ];
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Create payment intent for Stripe checkout
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const { planId } = req.body;
      const userId = req.session.user.id;
      const userEmail = req.session.user.email;

      // Plan pricing
      const planPricing = {
        managed_api: 900, // $9.00
        premium: 1900 // $19.00
      };

      const amount = planPricing[planId as keyof typeof planPricing];
      if (!amount) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          userId,
          planId,
          userEmail
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        planId,
        amount
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Handle successful payment and activate subscription
  app.post('/api/subscription/activate', isAuthenticated, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      const userId = req.session.user.id;

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const planId = paymentIntent.metadata.planId;
        
        // Update user subscription in storage
        await storage.updateUserSubscription(userId, {
          subscriptionTier: planId as any,
          subscriptionStatus: 'active',
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        res.json({ 
          success: true,
          planId,
          status: 'active'
        });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error) {
      console.error("Error activating subscription:", error);
      res.status(500).json({ message: "Failed to activate subscription" });
    }
  });

  app.get('/api/subscription/usage', isAuthenticated, async (req: any, res) => {
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
      const baseData = {
        ...req.body,
        ownerId: userId,
        allowedEmails: req.body.allowedEmails || [req.session.user.email], // Default to owner's email
      };
      
      const projectData = insertProjectSchema.parse(baseData);
      
      const project = await storage.createProject(projectData);
      
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
      
      // Create invitation record instead of requiring existing user
      // In a real app, this would send an email invitation
      const invitationId = Math.random().toString(36).substring(2, 15);
      
      // TODO: In production, send actual email invitation here
      console.log(`🚀 EMAIL INVITATION (Demo Mode):`);
      console.log(`   To: ${email}`);
      console.log(`   Project: ${projectId}`);
      console.log(`   Role: ${role}`);
      console.log(`   Invitation Link: https://projectflow.app/invite/${invitationId}`);
      
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
      
      res.json(member);
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Failed to add project member" });
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

  const httpServer = createServer(app);
  return httpServer;
}
