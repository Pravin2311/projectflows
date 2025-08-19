import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { insertProjectSchema, insertTaskSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
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
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const projectId = req.params.id;
      const { email, role = "member" } = req.body;
      
      // Check if user is admin/owner
      const membership = await storage.getUserProjectRole(projectId, userId);
      if (!membership || !["owner", "admin"].includes(membership.role!)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      // Find user by email (simplified - in real app would handle user lookup/invitation)
      const users = Array.from((storage as any).users.values());
      const targetUser = users.find((u: any) => u.email === email);
      
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const member = await storage.addProjectMember({
        projectId,
        userId: targetUser.id,
        role,
      });
      
      // Create activity
      await storage.createActivity({
        type: "member_added",
        description: `Added ${targetUser.firstName} ${targetUser.lastName} to the project`,
        projectId,
        userId,
        entityId: targetUser.id,
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has access to project
      const membership = await storage.getUserProjectRole(task.projectId, userId);
      if (!membership) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = req.body;
      const updatedTask = await storage.updateTask(taskId, updates);
      
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

  // Activity routes
  app.get("/api/projects/:projectId/activities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
