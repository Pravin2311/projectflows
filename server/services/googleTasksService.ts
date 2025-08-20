import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleApiConfig } from '../../shared/schema';

export interface GoogleTaskList {
  id: string;
  title: string;
  selfLink: string;
  updated: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  completed?: string;
  updated: string;
  selfLink: string;
  parent?: string; // For subtasks
  position: string;
  links?: Array<{
    type: string;
    description: string;
    link: string;
  }>;
}

export interface CreateGoogleTaskData {
  title: string;
  notes?: string;
  due?: string;
  parent?: string;
}

export class GoogleTasksService {
  private tasks: any;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig, private accessToken: string) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: ['https://www.googleapis.com/auth/tasks'],
    });
    
    this.tasks = google.tasks({ 
      version: 'v1', 
      auth: this.auth,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * Get all task lists for the user
   */
  async getTaskLists(): Promise<GoogleTaskList[]> {
    try {
      const response = await this.tasks.tasklists.list({
        maxResults: 100
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching task lists:', error);
      return [];
    }
  }

  /**
   * Create a new task list
   */
  async createTaskList(title: string): Promise<GoogleTaskList | null> {
    try {
      const response = await this.tasks.tasklists.insert({
        requestBody: {
          title
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating task list:', error);
      return null;
    }
  }

  /**
   * Get tasks from a specific task list
   */
  async getTasks(tasklistId: string): Promise<GoogleTask[]> {
    try {
      const response = await this.tasks.tasks.list({
        tasklist: tasklistId,
        maxResults: 100,
        showCompleted: true,
        showDeleted: false,
        showHidden: false
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  /**
   * Create a new task in Google Tasks
   */
  async createTask(tasklistId: string, taskData: CreateGoogleTaskData): Promise<GoogleTask | null> {
    try {
      const response = await this.tasks.tasks.insert({
        tasklist: tasklistId,
        requestBody: {
          title: taskData.title,
          notes: taskData.notes,
          due: taskData.due,
          parent: taskData.parent
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  /**
   * Update a task in Google Tasks
   */
  async updateTask(tasklistId: string, taskId: string, updates: Partial<CreateGoogleTaskData & { status: 'needsAction' | 'completed' }>): Promise<GoogleTask | null> {
    try {
      const response = await this.tasks.tasks.update({
        tasklist: tasklistId,
        task: taskId,
        requestBody: updates
      });

      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  /**
   * Delete a task from Google Tasks
   */
  async deleteTask(tasklistId: string, taskId: string): Promise<boolean> {
    try {
      await this.tasks.tasks.delete({
        tasklist: tasklistId,
        task: taskId
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  /**
   * Mark task as completed
   */
  async completeTask(tasklistId: string, taskId: string): Promise<GoogleTask | null> {
    return this.updateTask(tasklistId, taskId, {
      status: 'completed',
    });
  }

  /**
   * Sync ProjectFlow task to Google Tasks
   */
  async syncProjectTask(tasklistId: string, projectTask: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    status: 'todo' | 'in_progress' | 'done';
  }): Promise<GoogleTask | null> {
    try {
      // Check if task already exists by searching for it
      const existingTasks = await this.getTasks(tasklistId);
      const existingTask = existingTasks.find(task => 
        task.notes && task.notes.includes(`ProjectFlow Task ID: ${projectTask.id}`)
      );

      const taskData = {
        title: `[ProjectFlow] ${projectTask.title}`,
        notes: `${projectTask.description || ''}\n\nProjectFlow Task ID: ${projectTask.id}`,
        due: projectTask.dueDate,
        status: projectTask.status === 'done' ? 'completed' as const : 'needsAction' as const
      };

      if (existingTask) {
        // Update existing task
        return this.updateTask(tasklistId, existingTask.id, taskData);
      } else {
        // Create new task
        return this.createTask(tasklistId, taskData);
      }
    } catch (error) {
      console.error('Error syncing project task:', error);
      return null;
    }
  }
}