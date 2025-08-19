import { z } from "zod";

// Google API Configuration
export const googleApiConfigSchema = z.object({
  apiKey: z.string().min(1, "Google API key is required"),
  clientId: z.string().min(1, "Google Client ID is required"),
  clientSecret: z.string().min(1, "Google Client Secret is required"),
});
export type GoogleApiConfig = z.infer<typeof googleApiConfigSchema>;

// User types for Google Auth
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
  subscriptionTier: z.enum(["free", "managed_api", "premium"]).default("free"),
  subscriptionStatus: z.enum(["active", "cancelled", "expired"]).optional(),
  subscriptionExpiry: z.string().datetime().optional(),
  googlePaySubscriptionId: z.string().optional(), // Google Play Billing subscription ID
  googleCloudCustomerId: z.string().optional(), // Google Cloud billing customer ID
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const upsertUserSchema = userSchema.omit({
  createdAt: true,
  updatedAt: true,
});
export type UpsertUser = z.infer<typeof upsertUserSchema>;

// Project schema for Google Drive storage
export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  ownerId: z.string(),
  color: z.string().default("#7C3AED"),
  driveFileId: z.string(), // Google Drive file ID for project data
  allowedEmails: z.array(z.string().email()), // Email allowlist for team members
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const insertProjectSchema = projectSchema.omit({
  id: true,
  driveFileId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  createdById: z.string(),
  dueDate: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).default(0),
  position: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof taskSchema>;

export const insertTaskSchema = taskSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Project member schema
export const projectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  role: z.enum(["owner", "admin", "member"]).default("member"),
  joinedAt: z.string().datetime(),
});
export type ProjectMember = z.infer<typeof projectMemberSchema>;

export const insertProjectMemberSchema = projectMemberSchema.omit({
  id: true,
  joinedAt: true,
});
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

// Comment schema
export const commentSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Comment content is required"),
  taskId: z.string(),
  authorId: z.string(),
  createdAt: z.string().datetime(),
});
export type Comment = z.infer<typeof commentSchema>;

export const insertCommentSchema = commentSchema.omit({
  id: true,
  createdAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Activity schema
export const activitySchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  projectId: z.string(),
  userId: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
});
export type Activity = z.infer<typeof activitySchema>;

export const insertActivitySchema = activitySchema.omit({
  id: true,
  createdAt: true,
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// AI Suggestion schema
export const aiSuggestionSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  projectId: z.string(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  applied: z.boolean().default(false),
  dismissedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;

export const insertAiSuggestionSchema = aiSuggestionSchema.omit({
  id: true,
  createdAt: true,
});
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

// Project data structure that will be stored in Google Drive
export const projectDataSchema = z.object({
  project: projectSchema,
  tasks: z.array(taskSchema),
  members: z.array(projectMemberSchema),
  comments: z.array(commentSchema),
  activities: z.array(activitySchema),
  aiSuggestions: z.array(aiSuggestionSchema),
});
export type ProjectData = z.infer<typeof projectDataSchema>;

// Subscription Plans
export const subscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  features: z.array(z.string()),
  tier: z.enum(["free", "managed_api", "premium"]),
  popular: z.boolean().default(false),
});
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

// Usage tracking for API limits
export const usageTrackingSchema = z.object({
  userId: z.string(),
  month: z.string(), // YYYY-MM format
  googleDriveRequests: z.number().default(0),
  geminiRequests: z.number().default(0),
  projectsCreated: z.number().default(0),
  storageUsed: z.number().default(0), // in bytes
});
export type UsageTracking = z.infer<typeof usageTrackingSchema>;