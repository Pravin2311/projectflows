import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import type { GoogleApiConfig } from '../../shared/schema';

export interface GoogleContact {
  resourceName: string;
  displayName: string;
  emailAddress: string;
  phoneNumber?: string;
  photoUrl?: string;
  organization?: string;
}

export interface GoogleProfileInfo {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  phoneNumbers?: string[];
  addresses?: Array<{
    type: string;
    formattedValue: string;
  }>;
  organizations?: Array<{
    name: string;
    title?: string;
    department?: string;
  }>;
}

export class GooglePeopleService {
  private people: any;
  private auth: GoogleAuth;

  constructor(private config: GoogleApiConfig, private accessToken: string) {
    this.auth = new GoogleAuth({
      credentials: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
      },
      scopes: [
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    });
    
    this.people = google.people({ 
      version: 'v1', 
      auth: this.auth,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }

  /**
   * Get enhanced user profile information
   */
  async getProfileInfo(): Promise<GoogleProfileInfo | null> {
    try {
      const response = await this.people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos,phoneNumbers,addresses,organizations,metadata'
      });

      const person = response.data;
      if (!person) return null;

      const primaryEmail = person.emailAddresses?.find((email: any) => email.metadata?.primary)?.value;
      const primaryName = person.names?.find((name: any) => name.metadata?.primary);
      const primaryPhoto = person.photos?.find((photo: any) => photo.metadata?.primary)?.url;

      return {
        id: person.resourceName?.split('/')[1] || '',
        email: primaryEmail || '',
        displayName: primaryName?.displayName || '',
        firstName: primaryName?.givenName,
        lastName: primaryName?.familyName,
        photoUrl: primaryPhoto,
        phoneNumbers: person.phoneNumbers?.map((phone: any) => phone.value) || [],
        addresses: person.addresses?.map((addr: any) => ({
          type: addr.type || 'unknown',
          formattedValue: addr.formattedValue || ''
        })) || [],
        organizations: person.organizations?.map((org: any) => ({
          name: org.name || '',
          title: org.title,
          department: org.department
        })) || []
      };
    } catch (error) {
      console.error('Error fetching profile info:', error);
      return null;
    }
  }

  /**
   * Get user's contacts for team member suggestions
   */
  async getContacts(maxResults: number = 50): Promise<GoogleContact[]> {
    try {
      const response = await this.people.people.connections.list({
        resourceName: 'people/me',
        pageSize: maxResults,
        personFields: 'names,emailAddresses,photos,phoneNumbers,organizations'
      });

      const connections = response.data.connections || [];
      
      return connections
        .filter((person: any) => person.emailAddresses && person.emailAddresses.length > 0)
        .map((person: any) => {
          const primaryEmail = person.emailAddresses?.find((email: any) => email.metadata?.primary);
          const primaryName = person.names?.find((name: any) => name.metadata?.primary);
          const primaryPhoto = person.photos?.find((photo: any) => photo.metadata?.primary);
          const primaryOrg = person.organizations?.[0];

          return {
            resourceName: person.resourceName,
            displayName: primaryName?.displayName || primaryEmail?.value || 'Unknown',
            emailAddress: primaryEmail?.value || '',
            phoneNumber: person.phoneNumbers?.[0]?.value,
            photoUrl: primaryPhoto?.url,
            organization: primaryOrg?.name
          };
        })
        .filter((contact: GoogleContact) => contact.emailAddress);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  /**
   * Search contacts by email or name
   */
  async searchContacts(query: string): Promise<GoogleContact[]> {
    try {
      const contacts = await this.getContacts(100);
      
      const searchTerm = query.toLowerCase();
      return contacts.filter(contact => 
        contact.displayName.toLowerCase().includes(searchTerm) ||
        contact.emailAddress.toLowerCase().includes(searchTerm) ||
        (contact.organization && contact.organization.toLowerCase().includes(searchTerm))
      );
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  }
}