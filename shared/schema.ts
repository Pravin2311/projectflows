import { z } from "zod";

// Google API Configuration - Minimal initial setup
export const googleApiConfigSchema = z.object({
  apiKey: z.string().min(1, "Google API key is required"),
  clientId: z.string().min(1, "Google Client ID is required"),
  clientSecret: z.string().min(1, "Google Client Secret is required"),
  geminiApiKey: z.string().min(1, "Google AI (Gemini) API key is required"),
  email: z.string().email("Valid email address is required").optional(),
  // Optional APIs that can be enabled later
  enabledApis: z.object({
    drive: z.boolean().default(true), // Always enabled for core functionality
    gmail: z.boolean().default(false),
    contacts: z.boolean().default(false),
    tasks: z.boolean().default(false),
    calendar: z.boolean().default(false),
    docs: z.boolean().default(false),
    sheets: z.boolean().default(false),
    confluence: z.boolean().default(false), // Alternative to Google Docs for project documentation
  }).default({
    drive: true,
    gmail: false,
    contacts: false,
    tasks: false,
    calendar: false,
    docs: false,
    sheets: false,
  }),
});
export type GoogleApiConfig = z.infer<typeof googleApiConfigSchema>;

// Minimal setup schema for initial configuration
export const minimalGoogleConfigSchema = z.object({
  apiKey: z.string().min(1, "Google API key is required"),
  clientId: z.string().min(1, "Google Client ID is required"),
  clientSecret: z.string().min(1, "Google Client Secret is required"),
  geminiApiKey: z.string().min(1, "Google AI (Gemini) API key is required"),
  email: z.string().email("Valid Gmail address is required").refine(
    (email) => email.endsWith('@gmail.com'),
    { message: "Project owners must use a Gmail address" }
  ),
});
export type MinimalGoogleConfig = z.infer<typeof minimalGoogleConfigSchema>;

// User types for Google Auth
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().optional(),
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
  status: z.enum(["active", "completed", "archived", "on_hold"]).default("active"),
  driveFileId: z.string(), // Google Drive file ID for project data
  allowedEmails: z.array(z.string().email()).optional().default([]), // Email allowlist for team members
  memberEmails: z.array(z.string().email()).default([]), // Alternative name for compatibility
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().optional(),
  spentBudget: z.number().default(0),
  templateId: z.string().optional(), // Reference to project template
  // Shared Google API configuration - set by project owner, inherited by team members
  googleApiConfig: googleApiConfigSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const insertProjectSchema = projectSchema.omit({
  id: true,
  driveFileId: true,
  memberEmails: true,
  googleApiConfig: true, // Will be added later by owner
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
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  createdById: z.string(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().default(0),
  progress: z.number().min(0).max(100).default(0),
  position: z.number().default(0),
  dependsOn: z.array(z.string()).default([]), // Task IDs this task depends on
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]), // File URLs or IDs
  sprintId: z.string().optional(),
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
  mentions: z.array(z.string()).default([]), // Array of user IDs mentioned
  attachments: z.array(z.string()).default([]), // Array of file URLs/paths
  taskLinks: z.array(z.string()).default([]), // Array of linked task IDs
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

// Invitation schema
export const invitationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  email: z.string().email(),
  role: z.string(),
  inviterName: z.string(),
  status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  createdAt: z.string().datetime(),
});
export type Invitation = z.infer<typeof invitationSchema>;

export const insertInvitationSchema = invitationSchema.omit({
  id: true,
}).extend({
  id: z.string().optional(), // Allow pre-generated ID
});
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

// Sprint schema for Agile workflow
export const sprintSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Sprint name is required"),
  description: z.string().optional(),
  projectId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["planned", "active", "completed"]).default("planned"),
  goal: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Sprint = z.infer<typeof sprintSchema>;

export const insertSprintSchema = sprintSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSprint = z.infer<typeof insertSprintSchema>;

// Time entry schema for time tracking
export const timeEntrySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  description: z.string().optional(),
  hours: z.number().min(0),
  date: z.string().datetime(),
  billable: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TimeEntry = z.infer<typeof timeEntrySchema>;

export const insertTimeEntrySchema = timeEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;

// Template schema for reusable project/task templates
export const templateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  type: z.enum(["project", "task"]),
  template: z.record(z.any()), // JSON template data
  isPublic: z.boolean().default(false),
  ownerId: z.string(),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Template = z.infer<typeof templateSchema>;

export const insertTemplateSchema = templateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

// Notification schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["task_assigned", "task_completed", "project_updated", "comment_added", "deadline_approaching"]),
  entityId: z.string().optional(), // ID of related task/project/etc
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const insertNotificationSchema = notificationSchema.omit({
  id: true,
  createdAt: true,
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

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

// AI Usage Tracking (for user's own Google AI API usage monitoring)
export const aiUsageSchema = z.object({
  userId: z.string(),
  month: z.string(), // YYYY-MM format
  geminiRequests: z.number().default(0),
  geminiTokensUsed: z.number().default(0),
  lastUpdated: z.string().datetime(),
});
export type AiUsage = z.infer<typeof aiUsageSchema>;

// Usage Tracking for user's own API monitoring
export const usageTrackingSchema = z.object({
  userId: z.string(),
  month: z.string(), // YYYY-MM format
  googleDriveRequests: z.number().default(0),
  geminiRequests: z.number().default(0),
  projectsCreated: z.number().default(0),
  storageUsed: z.number().default(0), // in MB
});
export type UsageTracking = z.infer<typeof usageTrackingSchema>;