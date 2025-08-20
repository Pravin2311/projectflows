import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleApiConfig } from '../../shared/schema';

export interface GoogleSpreadsheet {
  spreadsheetId: string;
  title: string;
  createTime: string;
  updateTime: string;
  webViewLink: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    gridProperties: {
      rowCount: number;
      columnCount: number;
    };
  }>;
}

export interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export class GoogleSheetsService {
  private sheets: any;
  private drive: any;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig, private accessToken: string) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    
    this.sheets = google.sheets({ 
      version: 'v4', 
      auth: this.auth,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    this.drive = google.drive({ 
      version: 'v3', 
      auth: this.auth,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * Get list of Google Sheets
   */
  async getSpreadsheets(query?: string): Promise<GoogleSpreadsheet[]> {
    try {
      let q = "mimeType='application/vnd.google-apps.spreadsheet'";
      if (query) {
        q += ` and name contains '${query}'`;
      }

      const response = await this.drive.files.list({
        q,
        orderBy: 'modifiedTime desc',
        pageSize: 50,
        fields: 'files(id,name,createdTime,modifiedTime,webViewLink)'
      });

      const files = response.data.files || [];
      const spreadsheets: GoogleSpreadsheet[] = [];

      // Get detailed info for each spreadsheet
      for (const file of files) {
        try {
          const sheetResponse = await this.sheets.spreadsheets.get({
            spreadsheetId: file.id
          });

          spreadsheets.push({
            spreadsheetId: file.id,
            title: file.name,
            createTime: file.createdTime,
            updateTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            sheets: sheetResponse.data.sheets?.map((sheet: any) => ({
              sheetId: sheet.properties.sheetId,
              title: sheet.properties.title,
              gridProperties: sheet.properties.gridProperties
            })) || []
          });
        } catch (error) {
          console.error(`Error getting spreadsheet details for ${file.id}:`, error);
        }
      }

      return spreadsheets;
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
      throw new Error('Failed to fetch spreadsheets');
    }
  }

  /**
   * Get data from a sheet range
   */
  async getSheetData(spreadsheetId: string, range: string): Promise<SheetData | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return {
        range: response.data.range,
        majorDimension: response.data.majorDimension,
        values: response.data.values || []
      };
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      return null;
    }
  }

  /**
   * Update data in a sheet range
   */
  async updateSheetData(spreadsheetId: string, range: string, values: string[][]): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values
        }
      });

      return true;
    } catch (error) {
      console.error('Error updating sheet data:', error);
      return false;
    }
  }

  /**
   * Create a new spreadsheet
   */
  async createSpreadsheet(title: string, sheets?: string[]): Promise<GoogleSpreadsheet | null> {
    try {
      const sheetData = sheets?.map((sheetTitle, index) => ({
        properties: {
          sheetId: index,
          title: sheetTitle,
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      })) || [{
        properties: {
          title: 'Sheet1',
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      }];

      const response = await this.sheets.spreadsheets.create({
        resource: {
          properties: {
            title
          },
          sheets: sheetData
        }
      });

      const spreadsheetId = response.data.spreadsheetId;
      if (!spreadsheetId) return null;

      // Get file metadata
      const fileResponse = await this.drive.files.get({
        fileId: spreadsheetId,
        fields: 'id,name,createdTime,modifiedTime,webViewLink'
      });

      const file = fileResponse.data;
      return {
        spreadsheetId: file.id,
        title: file.name,
        createTime: file.createdTime,
        updateTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        sheets: response.data.sheets?.map((sheet: any) => ({
          sheetId: sheet.properties.sheetId,
          title: sheet.properties.title,
          gridProperties: sheet.properties.gridProperties
        })) || []
      };
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      return null;
    }
  }

  /**
   * Create project tracking spreadsheet
   */
  async createProjectTracker(projectName: string): Promise<GoogleSpreadsheet | null> {
    const spreadsheet = await this.createSpreadsheet(
      `${projectName} - Project Tracker`,
      ['Tasks', 'Timeline', 'Budget', 'Team']
    );

    if (!spreadsheet) return null;

    try {
      // Set up Tasks sheet
      await this.updateSheetData(spreadsheet.spreadsheetId, 'Tasks!A1:H1', [
        ['Task ID', 'Task Name', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date', 'Estimated Hours']
      ]);

      // Set up Timeline sheet
      await this.updateSheetData(spreadsheet.spreadsheetId, 'Timeline!A1:E1', [
        ['Milestone', 'Start Date', 'End Date', 'Status', 'Notes']
      ]);

      // Set up Budget sheet
      await this.updateSheetData(spreadsheet.spreadsheetId, 'Budget!A1:D1', [
        ['Category', 'Budgeted', 'Actual', 'Variance']
      ]);

      // Set up Team sheet
      await this.updateSheetData(spreadsheet.spreadsheetId, 'Team!A1:E1', [
        ['Name', 'Role', 'Email', 'Skills', 'Availability']
      ]);

      return spreadsheet;
    } catch (error) {
      console.error('Error setting up project tracker:', error);
      return spreadsheet; // Return the created spreadsheet even if setup fails
    }
  }

  /**
   * Sync project tasks to spreadsheet
   */
  async syncProjectTasks(spreadsheetId: string, tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assigneeId?: string;
    dueDate?: string;
    estimatedHours?: number;
  }>): Promise<boolean> {
    try {
      const values = [
        ['Task ID', 'Task Name', 'Description', 'Status', 'Priority', 'Assignee', 'Due Date', 'Estimated Hours'],
        ...tasks.map(task => [
          task.id,
          task.title,
          task.description || '',
          task.status,
          task.priority,
          task.assigneeId || '',
          task.dueDate || '',
          task.estimatedHours?.toString() || ''
        ])
      ];

      return await this.updateSheetData(spreadsheetId, 'Tasks!A1:H' + (tasks.length + 1), values);
    } catch (error) {
      console.error('Error syncing project tasks:', error);
      return false;
    }
  }
}