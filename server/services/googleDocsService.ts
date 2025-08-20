import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleApiConfig } from '../../shared/schema';

export interface GoogleDocument {
  documentId: string;
  title: string;
  createTime: string;
  updateTime: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export interface DocumentContent {
  body: {
    content: Array<{
      paragraph?: {
        elements: Array<{
          textRun?: {
            content: string;
            textStyle?: any;
          };
        }>;
      };
    }>;
  };
}

export class GoogleDocsService {
  private docs: any;
  private drive: any;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig, private accessToken: string) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });
    
    this.docs = google.docs({ 
      version: 'v1', 
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
   * Get list of Google Docs documents
   */
  async getDocuments(query?: string): Promise<GoogleDocument[]> {
    try {
      let q = "mimeType='application/vnd.google-apps.document'";
      if (query) {
        q += ` and name contains '${query}'`;
      }

      const response = await this.drive.files.list({
        q,
        orderBy: 'modifiedTime desc',
        pageSize: 50,
        fields: 'files(id,name,createdTime,modifiedTime,webViewLink,thumbnailLink)'
      });

      return (response.data.files || []).map((file: any) => ({
        documentId: file.id,
        title: file.name,
        createTime: file.createdTime,
        updateTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Get document content
   */
  async getDocumentContent(documentId: string): Promise<DocumentContent | null> {
    try {
      const response = await this.docs.documents.get({
        documentId,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching document content:', error);
      return null;
    }
  }

  /**
   * Create a new Google Doc
   */
  async createDocument(title: string, content?: string): Promise<GoogleDocument | null> {
    try {
      // Create document
      const createResponse = await this.docs.documents.create({
        resource: {
          title
        }
      });

      const documentId = createResponse.data.documentId;
      if (!documentId) return null;

      // Add initial content if provided
      if (content) {
        await this.docs.documents.batchUpdate({
          documentId,
          resource: {
            requests: [
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: content,
                },
              },
            ],
          },
        });
      }

      // Get file metadata
      const fileResponse = await this.drive.files.get({
        fileId: documentId,
        fields: 'id,name,createdTime,modifiedTime,webViewLink,thumbnailLink'
      });

      const file = fileResponse.data;
      return {
        documentId: file.id,
        title: file.name,
        createTime: file.createdTime,
        updateTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink
      };
    } catch (error) {
      console.error('Error creating document:', error);
      return null;
    }
  }

  /**
   * Update document content
   */
  async updateDocument(documentId: string, content: string): Promise<boolean> {
    try {
      // Clear existing content and add new content
      await this.docs.documents.batchUpdate({
        documentId,
        resource: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: -1
                }
              }
            },
            {
              insertText: {
                location: {
                  index: 1,
                },
                text: content,
              },
            },
          ],
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }

  /**
   * Create project documentation template
   */
  async createProjectDocumentation(projectName: string, projectDescription?: string): Promise<GoogleDocument | null> {
    const content = `# ${projectName} - Project Documentation

## Project Overview
${projectDescription || 'Add project description here...'}

## Project Goals
- Define clear objectives
- Set measurable outcomes
- Establish success criteria

## Team Members
- Project Owner: [Name]
- Team Members: [Add team members]

## Timeline
- Start Date: [Date]
- Key Milestones: [Add milestones]
- End Date: [Date]

## Resources
- Budget: [Amount]
- Tools & Technology: [List tools]
- External Resources: [List resources]

## Communication Plan
- Regular Meetings: [Schedule]
- Status Updates: [Frequency]
- Communication Channels: [List channels]

## Risk Management
- Identified Risks: [List potential risks]
- Mitigation Strategies: [Add strategies]

## Notes & Updates
[Add project notes and updates here...]
`;

    return this.createDocument(`${projectName} - Documentation`, content);
  }
}