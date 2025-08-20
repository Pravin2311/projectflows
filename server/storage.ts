import {
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectMember,
  type InsertProjectMember,
  type Task,
  type InsertTask,
  type Comment,
  type InsertComment,
  type Activity,
  type InsertActivity,
  type AiSuggestion,
  type InsertAiSuggestion,
  type SubscriptionPlan,
  type UsageTracking,
} from "../shared/schema.js";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project member operations
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user?: User })[]>;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  getUserProjectRole(projectId: string, userId: string): Promise<ProjectMember | undefined>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getProjectTasks(projectId: string): Promise<(Task & { assignee?: User; createdBy: User })[]>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getTaskComments(taskId: string): Promise<(Comment & { author: User })[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getProjectActivities(projectId: string, limit?: number): Promise<(Activity & { user?: User })[]>;
  
  // AI Suggestion operations
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  getProjectAiSuggestions(projectId: string): Promise<AiSuggestion[]>;
  updateAiSuggestion(id: string, updates: Partial<InsertAiSuggestion>): Promise<AiSuggestion>;
  
  // Subscription operations
  updateUserSubscription(userId: string, updates: Partial<UpsertUser>): Promise<User>;
  getUserUsage(userId: string, month: string): Promise<UsageTracking>;
  updateUsage(userId: string, month: string, updates: Partial<UsageTracking>): Promise<UsageTracking>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private projects: Map<string, Project> = new Map();
  private projectMembers: Map<string, ProjectMember> = new Map();
  private tasks: Map<string, Task> = new Map();
  private comments: Map<string, Comment> = new Map();
  private activities: Map<string, Activity> = new Map();
  private aiSuggestions: Map<string, AiSuggestion> = new Map();
  private usage: Map<string, UsageTracking> = new Map(); // userId-month as key
  
  // Static subscription plans
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for personal projects and trying out the platform",
      price: 0,
      tier: "free",
      popular: false,
      features: [
        "Unlimited projects in your Google Drive",
        "Basic kanban boards",
        "Team collaboration via email",
        "Basic Google Drive integration",
        "Community support"
      ]
    },
    {
      id: "managed_api",
      name: "Managed API",
      description: "Skip the technical setup - we handle Google API configuration",
      price: 9,
      tier: "managed_api", 
      popular: true,
      features: [
        "Everything in Free",
        "Pre-configured Google API access",
        "Higher API rate limits",
        "No technical setup required",
        "Priority email support",
        "Advanced Google Drive features"
      ]
    },
    {
      id: "premium", 
      name: "Premium",
      description: "Advanced features for power users and teams",
      price: 19,
      tier: "premium",
      popular: false,
      features: [
        "Everything in Managed API",
        "AI-powered project insights",
        "Custom automations and workflows", 
        "Advanced reporting and analytics",
        "Custom integrations (Slack, Discord)",
        "Time tracking and productivity metrics",
        "Priority chat support"
      ]
    }
  ];

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const now = new Date().toISOString();
    const user: User = {
      ...userData,
      id: userData.id || randomUUID(),
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  // Project operations
  async createProject(projectData: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id,
      driveFileId: `temp-${id}`, // Will be updated with actual Google Drive file ID
      memberEmails: projectData.allowedEmails || [],
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, project);
    
    // Add owner as project member
    await this.addProjectMember({
      projectId: id,
      userId: projectData.ownerId,
      role: "owner",
    });
    
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const userMemberships = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId);
    
    return userMemberships
      .map(member => this.projects.get(member.projectId))
      .filter(Boolean) as Project[];
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error("Project not found");
    
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
    // Clean up related data
    Array.from(this.projectMembers.entries())
      .filter(([_, member]) => member.projectId === id)
      .forEach(([memberId]) => this.projectMembers.delete(memberId));
    
    Array.from(this.tasks.entries())
      .filter(([_, task]) => task.projectId === id)
      .forEach(([taskId]) => this.tasks.delete(taskId));
  }

  // Project member operations
  async addProjectMember(memberData: InsertProjectMember): Promise<ProjectMember> {
    const id = randomUUID();
    const member: ProjectMember = {
      ...memberData,
      id,
      joinedAt: new Date().toISOString(),
    };
    this.projectMembers.set(id, member);
    return member;
  }

  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user?: User })[]> {
    const members = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
    
    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId),
    }));
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const memberEntry = Array.from(this.projectMembers.entries())
      .find(([_, member]) => member.projectId === projectId && member.userId === userId);
    
    if (memberEntry) {
      this.projectMembers.delete(memberEntry[0]);
    }
  }

  async getUserProjectRole(projectId: string, userId: string): Promise<ProjectMember | undefined> {
    return Array.from(this.projectMembers.values())
      .find(member => member.projectId === projectId && member.userId === userId);
  }

  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getProjectTasks(projectId: string): Promise<(Task & { assignee?: User; createdBy: User })[]> {
    const projectTasks = Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
    
    return projectTasks.map(task => ({
      ...task,
      assignee: task.assigneeId ? this.users.get(task.assigneeId) : undefined,
      createdBy: this.users.get(task.createdById)!,
    })).filter(task => task.createdBy);
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task> {
    console.log('Storage: Updating task', id, 'with updates:', updates);
    const existing = this.tasks.get(id);
    if (!existing) throw new Error("Task not found");
    
    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    console.log('Storage: Task updated successfully. New task state:', updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
    // Clean up comments
    Array.from(this.comments.entries())
      .filter(([_, comment]) => comment.taskId === id)
      .forEach(([commentId]) => this.comments.delete(commentId));
  }

  // Comment operations
  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...commentData,
      id,
      mentions: commentData.mentions || [],
      attachments: commentData.attachments || [],
      taskLinks: commentData.taskLinks || [],
      createdAt: new Date().toISOString(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getTaskComments(taskId: string): Promise<(Comment & { author: User })[]> {
    const taskComments = Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return taskComments.map(comment => ({
      ...comment,
      author: this.users.get(comment.authorId)!,
    })).filter(comment => comment.author);
  }

  // Activity operations
  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...activityData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getProjectActivities(projectId: string, limit = 20): Promise<(Activity & { user?: User })[]> {
    const projectActivities = Array.from(this.activities.values())
      .filter(activity => activity.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
    
    return projectActivities.map(activity => ({
      ...activity,
      user: activity.userId ? this.users.get(activity.userId) : undefined,
    }));
  }

  // AI Suggestion operations
  async createAiSuggestion(suggestionData: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = randomUUID();
    const suggestion: AiSuggestion = {
      ...suggestionData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  async getProjectAiSuggestions(projectId: string): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.projectId === projectId && !suggestion.dismissedAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async updateAiSuggestion(id: string, updates: Partial<InsertAiSuggestion>): Promise<AiSuggestion> {
    const existing = this.aiSuggestions.get(id);
    if (!existing) throw new Error("AI suggestion not found");
    
    const updated: AiSuggestion = {
      ...existing,
      ...updates,
    };
    this.aiSuggestions.set(id, updated);
    return updated;
  }

  // Subscription operations
  async updateUserSubscription(userId: string, updates: Partial<UpsertUser>): Promise<User> {
    const existing = this.users.get(userId);
    if (!existing) throw new Error("User not found");
    
    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(userId, updated);
    return updated;
  }

  async getUserUsage(userId: string, month: string): Promise<UsageTracking> {
    const key = `${userId}-${month}`;
    const existing = this.usage.get(key);
    
    if (existing) return existing;
    
    // Create new usage tracking for the month
    const newUsage: UsageTracking = {
      userId,
      month,
      googleDriveRequests: 0,
      geminiRequests: 0,
      projectsCreated: 0,
      storageUsed: 0,
    };
    
    this.usage.set(key, newUsage);
    return newUsage;
  }

  async updateUsage(userId: string, month: string, updates: Partial<UsageTracking>): Promise<UsageTracking> {
    const key = `${userId}-${month}`;
    const existing = await this.getUserUsage(userId, month);
    
    const updated: UsageTracking = {
      ...existing,
      ...updates,
    };
    
    this.usage.set(key, updated);
    return updated;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlans;
  }
}

export const storage = new MemStorage();
