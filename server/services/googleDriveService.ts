import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { nanoid } from 'nanoid';
import { 
  Project, 
  Task, 
  ProjectMember, 
  Comment, 
  Activity, 
  AiSuggestion, 
  ProjectData,
  GoogleApiConfig 
} from '@shared/schema';

export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    
    this.drive = google.drive({ 
      version: 'v3', 
      auth: this.auth 
    });
  }

  /**
   * Creates a new project folder and data file in Google Drive
   */
  async createProject(projectData: Omit<Project, 'id' | 'driveFileId' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const projectId = this.generateId();
    const now = new Date().toISOString();
    
    // Create project folder
    const folderResponse = await this.drive.files.create({
      requestBody: {
        name: `PM_${projectData.name}_${projectId}`,
        mimeType: 'application/vnd.google-apps.folder',
        description: `Project Management Data for: ${projectData.name}`,
      },
    });

    const folderId = folderResponse.data.id!;

    // Create initial project data
    const project: Project = {
      ...projectData,
      id: projectId,
      driveFileId: folderId,
      createdAt: now,
      updatedAt: now,
    };

    const initialProjectData: ProjectData = {
      project,
      tasks: [],
      members: [],
      comments: [],
      activities: [],
      aiSuggestions: [],
    };

    // Create project data file
    await this.drive.files.create({
      requestBody: {
        name: 'project-data.json',
        parents: [folderId],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(initialProjectData, null, 2),
      },
    });

    return project;
  }

  /**
   * Retrieves project data from Google Drive
   */
  async getProjectData(driveFileId: string): Promise<ProjectData | null> {
    try {
      // Find the project data file
      const filesResponse = await this.drive.files.list({
        q: `'${driveFileId}' in parents and name='project-data.json'`,
        fields: 'files(id, name)',
      });

      if (!filesResponse.data.files || filesResponse.data.files.length === 0) {
        return null;
      }

      const fileId = filesResponse.data.files[0].id!;
      
      // Get file content
      const fileResponse = await this.drive.files.get({
        fileId,
        alt: 'media',
      });

      return JSON.parse(fileResponse.data as string) as ProjectData;
    } catch (error) {
      console.error('Error retrieving project data:', error);
      return null;
    }
  }

  /**
   * Updates project data in Google Drive
   */
  async updateProjectData(driveFileId: string, projectData: ProjectData): Promise<void> {
    try {
      // Find the project data file
      const filesResponse = await this.drive.files.list({
        q: `'${driveFileId}' in parents and name='project-data.json'`,
        fields: 'files(id, name)',
      });

      if (!filesResponse.data.files || filesResponse.data.files.length === 0) {
        throw new Error('Project data file not found');
      }

      const fileId = filesResponse.data.files[0].id!;

      // Update the file
      await this.drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(projectData, null, 2),
        },
      });
    } catch (error) {
      console.error('Error updating project data:', error);
      throw error;
    }
  }

  /**
   * Lists all projects accessible to the user
   */
  async listProjects(): Promise<Project[]> {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and name contains 'PM_'",
        fields: 'files(id, name, description, createdTime, modifiedTime)',
      });

      const projects: Project[] = [];

      if (response.data.files) {
        for (const folder of response.data.files) {
          try {
            const projectData = await this.getProjectData(folder.id!);
            if (projectData) {
              projects.push(projectData.project);
            }
          } catch (error) {
            console.warn(`Failed to load project data for folder ${folder.id}:`, error);
          }
        }
      }

      return projects;
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }

  /**
   * Shares a project folder with team members
   */
  async shareProject(driveFileId: string, emails: string[]): Promise<void> {
    try {
      for (const email of emails) {
        await this.drive.permissions.create({
          fileId: driveFileId,
          requestBody: {
            role: 'writer',
            type: 'user',
            emailAddress: email,
          },
        });
      }
    } catch (error) {
      console.error('Error sharing project:', error);
      throw error;
    }
  }

  /**
   * Creates a shareable link for project access
   */
  async createShareableLink(driveFileId: string): Promise<string> {
    try {
      // Make the folder viewable by anyone with the link
      await this.drive.permissions.create({
        fileId: driveFileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Get the shareable link
      const fileResponse = await this.drive.files.get({
        fileId: driveFileId,
        fields: 'webViewLink',
      });

      return fileResponse.data.webViewLink || '';
    } catch (error) {
      console.error('Error creating shareable link:', error);
      throw error;
    }
  }

  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return nanoid();
  }

  /**
   * Checks if user has access to a project
   */
  async hasProjectAccess(driveFileId: string, userEmail: string): Promise<boolean> {
    try {
      const permissions = await this.drive.permissions.list({
        fileId: driveFileId,
        fields: 'permissions(emailAddress, role)',
      });

      return permissions.data.permissions?.some(
        (permission: any) => permission.emailAddress === userEmail
      ) || false;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }
}

// Helper functions for working with project data
export class ProjectDataManager {
  static addTask(projectData: ProjectData, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): ProjectData {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...projectData,
      tasks: [...projectData.tasks, newTask],
    };
  }

  static updateTask(projectData: ProjectData, taskId: string, updates: Partial<Task>): ProjectData {
    const now = new Date().toISOString();
    
    return {
      ...projectData,
      tasks: projectData.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: now }
          : task
      ),
    };
  }

  static deleteTask(projectData: ProjectData, taskId: string): ProjectData {
    return {
      ...projectData,
      tasks: projectData.tasks.filter(task => task.id !== taskId),
      comments: projectData.comments.filter(comment => comment.taskId !== taskId),
    };
  }

  static addComment(projectData: ProjectData, comment: Omit<Comment, 'id' | 'createdAt'>): ProjectData {
    const now = new Date().toISOString();
    const newComment: Comment = {
      ...comment,
      id: this.generateId(),
      createdAt: now,
    };

    return {
      ...projectData,
      comments: [...projectData.comments, newComment],
    };
  }

  static addActivity(projectData: ProjectData, activity: Omit<Activity, 'id' | 'createdAt'>): ProjectData {
    const now = new Date().toISOString();
    const newActivity: Activity = {
      ...activity,
      id: this.generateId(),
      createdAt: now,
    };

    return {
      ...projectData,
      activities: [...projectData.activities, newActivity],
    };
  }

  static addAiSuggestion(projectData: ProjectData, suggestion: Omit<AiSuggestion, 'id' | 'createdAt'>): ProjectData {
    const now = new Date().toISOString();
    const newSuggestion: AiSuggestion = {
      ...suggestion,
      id: this.generateId(),
      createdAt: now,
    };

    return {
      ...projectData,
      aiSuggestions: [...projectData.aiSuggestions, newSuggestion],
    };
  }

  private static generateId(): string {
    return nanoid();
  }
}