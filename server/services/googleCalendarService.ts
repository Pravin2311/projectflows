import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleApiConfig } from '../../shared/schema';

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  primary?: boolean;
  accessRole: string;
  colorId?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  conferenceData?: {
    conferenceSolution: {
      key: {
        type: string;
      };
    };
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  htmlLink: string;
  status: 'tentative' | 'confirmed' | 'cancelled';
  created: string;
  updated: string;
}

export interface CreateCalendarEventData {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  attendees?: string[];
  location?: string;
  reminders?: Array<{
    method: 'email' | 'popup';
    minutes: number;
  }>;
  conferenceData?: boolean; // Whether to create a Google Meet link
}

export class GoogleCalendarService {
  private calendar: any;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig, private accessToken: string) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    });
    
    this.calendar = google.calendar({ 
      version: 'v3', 
      auth: this.auth,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * Get user's calendars
   */
  async getCalendars(): Promise<GoogleCalendar[]> {
    try {
      const response = await this.calendar.calendarList.list({
        maxResults: 100
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  }

  /**
   * Get events from a specific calendar
   */
  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(calendarId: string = 'primary', eventData: CreateCalendarEventData): Promise<GoogleCalendarEvent | null> {
    try {
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: eventData.timeZone || 'UTC',
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: eventData.timeZone || 'UTC',
        },
        attendees: eventData.attendees?.map(email => ({ email })),
        location: eventData.location,
        reminders: eventData.reminders ? {
          useDefault: false,
          overrides: eventData.reminders
        } : {
          useDefault: true
        },
        conferenceData: eventData.conferenceData ? {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        } : undefined
      };

      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
        conferenceDataVersion: eventData.conferenceData ? 1 : 0,
        sendUpdates: 'all' // Send email invitations to attendees
      });

      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(calendarId: string, eventId: string, updates: Partial<CreateCalendarEventData>): Promise<GoogleCalendarEvent | null> {
    try {
      const updateData: any = {};
      
      if (updates.summary) updateData.summary = updates.summary;
      if (updates.description) updateData.description = updates.description;
      if (updates.startDateTime) {
        updateData.start = {
          dateTime: updates.startDateTime,
          timeZone: updates.timeZone || 'UTC'
        };
      }
      if (updates.endDateTime) {
        updateData.end = {
          dateTime: updates.endDateTime,
          timeZone: updates.timeZone || 'UTC'
        };
      }
      if (updates.attendees) {
        updateData.attendees = updates.attendees.map(email => ({ email }));
      }
      if (updates.location) updateData.location = updates.location;

      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: updateData,
        sendUpdates: 'all'
      });

      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<boolean> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }

  /**
   * Create a project milestone event
   */
  async createProjectMilestone(projectName: string, milestone: {
    title: string;
    description?: string;
    dueDate: string;
    attendees?: string[];
  }): Promise<GoogleCalendarEvent | null> {
    const eventData: CreateCalendarEventData = {
      summary: `[${projectName}] ${milestone.title}`,
      description: `Project Milestone: ${milestone.description || milestone.title}\n\nProject: ${projectName}`,
      startDateTime: milestone.dueDate,
      endDateTime: new Date(new Date(milestone.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
      attendees: milestone.attendees,
      reminders: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }       // 1 hour before
      ]
    };

    return this.createEvent('primary', eventData);
  }

  /**
   * Create a team meeting event
   */
  async createTeamMeeting(projectName: string, meeting: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    attendees: string[];
    location?: string;
    includeMeet?: boolean;
  }): Promise<GoogleCalendarEvent | null> {
    const eventData: CreateCalendarEventData = {
      summary: `[${projectName}] ${meeting.title}`,
      description: `${meeting.description || ''}\n\nProject: ${projectName}`,
      startDateTime: meeting.startDateTime,
      endDateTime: meeting.endDateTime,
      attendees: meeting.attendees,
      location: meeting.location,
      conferenceData: meeting.includeMeet,
      reminders: [
        { method: 'email', minutes: 30 },
        { method: 'popup', minutes: 10 }
      ]
    };

    return this.createEvent('primary', eventData);
  }

  /**
   * Get upcoming project deadlines from calendar
   */
  async getProjectDeadlines(projectName: string, daysAhead: number = 30): Promise<GoogleCalendarEvent[]> {
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
      
      const events = await this.getEvents('primary', timeMin, timeMax);
      
      return events.filter(event => 
        event.summary && event.summary.includes(`[${projectName}]`)
      );
    } catch (error) {
      console.error('Error fetching project deadlines:', error);
      return [];
    }
  }
}