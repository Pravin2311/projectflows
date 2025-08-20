import { google } from 'googleapis';

export class GoogleEmailService {
  private gmail: any;
  
  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async sendInvitationEmail({
    to,
    projectName,
    projectId,
    inviterName,
    role,
    inviteLink
  }: {
    to: string;
    projectName: string;
    projectId?: string;
    inviterName: string;
    role: string;
    inviteLink: string;
  }): Promise<void> {
    const subject = `You're invited to join "${projectName}" on ProjectFlow`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">You're invited to collaborate!</h2>
        
        <p>Hi there,</p>
        
        <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> as a <strong>${role}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Project: ${projectName}</h3>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Invited by:</strong> ${inviterName}</p>
          ${projectId ? `<p><strong>Project ID:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${projectId}</code></p>` : ''}
        </div>
        
        <p>ProjectFlow is a completely free project management platform that stores all your data in your own Google Drive. You maintain full control and ownership of your project data.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        
        <p><small>If you can't click the button above, copy and paste this link into your browser:<br>
        ${inviteLink}</small></p>
        
        ${projectId ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; font-size: 14px;"><strong>Alternative Access:</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">If you can't access the invitation link, you can also join the project by:</p>
          <ol style="margin: 5px 0 0 0; font-size: 14px; padding-left: 20px;">
            <li>Go to the ProjectFlow homepage</li>
            <li>Click "Member Login"</li>
            <li>Enter Project ID: <strong>${projectId}</strong></li>
          </ol>
        </div>
        ` : ''}
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 14px;">
          This invitation was sent from ProjectFlow, a free Google-powered project management platform.<br>
          Your data stays in your Google Drive - we never store or access your project information.
        </p>
      </div>
    `;

    const textBody = `
You're invited to join "${projectName}" on ProjectFlow

Hi there,

${inviterName} has invited you to join the project "${projectName}" as a ${role}.
${projectId ? `Project ID: ${projectId}` : ''}

ProjectFlow is a completely free project management platform that stores all your data in your own Google Drive. You maintain full control and ownership of your project data.

Accept your invitation here: ${inviteLink}

If you can't click the link above, copy and paste it into your browser.

${projectId ? `Alternative Access:
If you can't access the invitation link, you can also join the project by:
1. Go to the ProjectFlow homepage
2. Click "Member Login" 
3. Enter Project ID: ${projectId}

` : ''}This invitation was sent from ProjectFlow, a free Google-powered project management platform.
Your data stays in your Google Drive - we never store or access your project information.
    `;

    // Create the email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].join('\n');

    // Encode the message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      
      console.log(`✅ Email invitation sent to ${to} for project "${projectName}"`);
    } catch (error) {
      console.error('❌ Failed to send email invitation:', error);
      throw new Error(`Failed to send invitation email: ${error}`);
    }
  }
}