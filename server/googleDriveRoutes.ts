import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupGoogleAuth, isAuthenticated, AuthenticatedRequest } from "./googleAuth";
import { GoogleDriveService, ProjectDataManager } from "./services/googleDriveService";
import { insertProjectSchema, insertTaskSchema, insertCommentSchema } from "@shared/schema";


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google Auth
  setupGoogleAuth(app);

  // Helper function to get Google Drive service instance
  const getDriveService = (req: AuthenticatedRequest) => {
    if (!req.googleConfig) {
      throw new Error('Google API configuration not found');
    }
    return new GoogleDriveService(req.googleConfig);
  };

  // Project routes
  app.post("/api/projects", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projectData = insertProjectSchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      
      const project = await driveService.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/projects", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projects = await driveService.listProjects();
      
      // Filter projects based on user access
      const userProjects = [];
      for (const project of projects) {
        const hasAccess = await driveService.hasProjectAccess(project.driveFileId, req.user!.email);
        if (hasAccess || project.ownerId === req.user!.id) {
          userProjects.push(project);
        }
      }
      
      res.json(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projectId = req.params.id;
      
      const projects = await driveService.listProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check user access
      const hasAccess = await driveService.hasProjectAccess(project.driveFileId, req.user!.email);
      if (!hasAccess && project.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const projectData = await driveService.getProjectData(project.driveFileId);
      res.json(projectData);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Task routes
  app.post("/api/projects/:projectId/tasks", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projectId = req.params.projectId;
      
      const projects = await driveService.listProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const projectData = await driveService.getProjectData(project.driveFileId);
      if (!projectData) {
        return res.status(404).json({ message: "Project data not found" });
      }
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId,
        createdById: req.user!.id,
      });
      
      const updatedProjectData = ProjectDataManager.addTask(projectData, taskData);
      
      // Add activity
      const activity = {
        type: "task_created",
        description: `Created task "${taskData.title}"`,
        projectId,
        userId: req.user!.id,
        entityId: updatedProjectData.tasks[updatedProjectData.tasks.length - 1].id,
      };
      const finalProjectData = ProjectDataManager.addActivity(updatedProjectData, activity);
      
      await driveService.updateProjectData(project.driveFileId, finalProjectData);
      
      res.json(updatedProjectData.tasks[updatedProjectData.tasks.length - 1]);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:taskId", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const taskId = req.params.taskId;
      
      // Find project containing this task
      const projects = await driveService.listProjects();
      let targetProject = null;
      let projectData = null;
      
      for (const project of projects) {
        const data = await driveService.getProjectData(project.driveFileId);
        if (data && data.tasks.some(task => task.id === taskId)) {
          targetProject = project;
          projectData = data;
          break;
        }
      }
      
      if (!targetProject || !projectData) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedProjectData = ProjectDataManager.updateTask(projectData, taskId, req.body);
      await driveService.updateProjectData(targetProject.driveFileId, updatedProjectData);
      
      const updatedTask = updatedProjectData.tasks.find(task => task.id === taskId);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:taskId", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const taskId = req.params.taskId;
      
      // Find project containing this task
      const projects = await driveService.listProjects();
      let targetProject = null;
      let projectData = null;
      
      for (const project of projects) {
        const data = await driveService.getProjectData(project.driveFileId);
        if (data && data.tasks.some(task => task.id === taskId)) {
          targetProject = project;
          projectData = data;
          break;
        }
      }
      
      if (!targetProject || !projectData) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const updatedProjectData = ProjectDataManager.deleteTask(projectData, taskId);
      await driveService.updateProjectData(targetProject.driveFileId, updatedProjectData);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Comment routes
  app.post("/api/tasks/:taskId/comments", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const taskId = req.params.taskId;
      
      // Find project containing this task
      const projects = await driveService.listProjects();
      let targetProject = null;
      let projectData = null;
      
      for (const project of projects) {
        const data = await driveService.getProjectData(project.driveFileId);
        if (data && data.tasks.some(task => task.id === taskId)) {
          targetProject = project;
          projectData = data;
          break;
        }
      }
      
      if (!targetProject || !projectData) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        taskId,
        authorId: req.user!.id,
      });
      
      const updatedProjectData = ProjectDataManager.addComment(projectData, commentData);
      await driveService.updateProjectData(targetProject.driveFileId, updatedProjectData);
      
      const newComment = updatedProjectData.comments[updatedProjectData.comments.length - 1];
      res.json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projects = await driveService.listProjects();
      
      // Calculate stats from projects
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      
      // For now, return mock task stats since we'd need to load all project tasks
      // In a real implementation, you'd want to cache these stats or calculate them more efficiently
      const stats = {
        totalProjects,
        activeProjects,
        completedTasks: Math.floor(totalProjects * 2.5), // Rough estimate
        pendingTasks: Math.floor(totalProjects * 1.8) // Rough estimate
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // AI suggestions route
  app.get("/api/projects/:projectId/ai-suggestions", isAuthenticated as any, async (req: any, res: any) => {
    try {
      // For now, return empty array - AI integration can be added later
      res.json([]);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      res.status(500).json({ message: "Failed to fetch AI suggestions" });
    }
  });

  // Project sharing routes
  app.post("/api/projects/:projectId/share", isAuthenticated as any, async (req: any, res: any) => {
    try {
      const driveService = getDriveService(req);
      const projectId = req.params.projectId;
      const { emails } = req.body;
      
      const projects = await driveService.listProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      if (project.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Only project owner can share" });
      }
      
      await driveService.shareProject(project.driveFileId, emails);
      const shareableLink = await driveService.createShareableLink(project.driveFileId);
      
      res.json({ shareableLink });
    } catch (error) {
      console.error("Error sharing project:", error);
      res.status(500).json({ message: "Failed to share project" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}