import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set. Email functionality will be disabled.');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailTemplateData {
  communityName: string;
  applicantName?: string;
  applicantEmail: string;
  whatsappInviteUrl?: string;
  customAcceptanceMessage?: string;
  customDenialMessage?: string;
  formTitle: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@your-domain.com';
  private static readonly DEFAULT_FROM_NAME = 'Community Applications';

  // Email Templates
  private static getConfirmationTemplate(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const subject = `Application Received - ${data.communityName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Application Received!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              
              <p>Thank you for applying to join <strong>${data.communityName}</strong>.</p>
              
              <div class="highlight">
                <p style="margin: 0;"><strong>What happens next?</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>We've received your application and will review it shortly</li>
                  <li>You'll receive an email notification with our decision</li>
                  ${data.whatsappInviteUrl ? '<li>If accepted, you\'ll receive a WhatsApp group invitation</li>' : ''}
                </ul>
              </div>
              
              <p>We appreciate your interest and will get back to you soon!</p>
              
              <p>Best regards,<br>
              <strong>${data.communityName} Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from ${data.communityName}. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Application Received - ${data.communityName}

Hi there,

Thank you for applying to join ${data.communityName}.

We've received your application and will review it shortly. You'll hear back from us with our decision soon.

${data.whatsappInviteUrl ? 'If accepted, you\'ll receive a WhatsApp group invitation.' : ''}

Best regards,
${data.communityName} Team

---
This is an automated message. Please do not reply to this email.
    `;

    return { subject, html, text };
  }

  private static getAcceptanceTemplate(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const subject = `Welcome to ${data.communityName}! 🎉`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .success-box { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .whatsapp-button { display: inline-block; background: #25d366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .custom-message { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">You've been accepted!</p>
            </div>
            <div class="content">
              <p>Hi ${data.applicantName || 'there'},</p>
              
              <div class="success-box">
                <p style="margin: 0; font-size: 18px; font-weight: bold;">Great news! Your application to join ${data.communityName} has been accepted.</p>
              </div>
              
              ${data.customAcceptanceMessage ? `
                <div class="custom-message">
                  <p style="margin: 0;">${data.customAcceptanceMessage}</p>
                </div>
              ` : ''}
              
              ${data.whatsappInviteUrl ? `
                <p><strong>Next Step:</strong> Join our WhatsApp community to connect with other members:</p>
                <div style="text-align: center;">
                  <a href="${data.whatsappInviteUrl}" class="whatsapp-button" target="_blank">
                    📱 Join WhatsApp Group
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;"><em>If the button doesn't work, copy and paste this link: ${data.whatsappInviteUrl}</em></p>
              ` : ''}
              
              <p>Welcome aboard! We're excited to have you as part of our community.</p>
              
              <p>Best regards,<br>
              <strong>${data.communityName} Team</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent to ${data.applicantEmail}. Welcome to ${data.communityName}!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to ${data.communityName}! 🎉

Hi ${data.applicantName || 'there'},

Great news! Your application to join ${data.communityName} has been accepted.

${data.customAcceptanceMessage || ''}

${data.whatsappInviteUrl ? `Join our WhatsApp community: ${data.whatsappInviteUrl}` : ''}

Welcome aboard!

Best regards,
${data.communityName} Team
    `;

    return { subject, html, text };
  }

  private static getDenialTemplate(data: EmailTemplateData): { subject: string; html: string; text: string } {
    const subject = `${data.communityName} Application Update`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .message-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            <div class="content">
              <p>Hi ${data.applicantName || 'there'},</p>
              
              <p>Thank you for your interest in joining <strong>${data.communityName}</strong>.</p>
              
              ${data.customDenialMessage ? `
                <div class="message-box">
                  <p style="margin: 0;">${data.customDenialMessage}</p>
                </div>
              ` : `
                <p>After careful consideration, we've decided not to move forward with your application at this time.</p>
              `}
              
              <p>We appreciate the time you took to apply and wish you the best in your endeavors.</p>
              
              <p>Best regards,<br>
              <strong>${data.communityName} Team</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent to ${data.applicantEmail}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
${data.communityName} Application Update

Hi ${data.applicantName || 'there'},

Thank you for your interest in joining ${data.communityName}.

${data.customDenialMessage || 'After careful consideration, we\'ve decided not to move forward with your application at this time.'}

We appreciate the time you took to apply and wish you the best.

Best regards,
${data.communityName} Team
    `;

    return { subject, html, text };
  }

  // Send confirmation email
  static async sendConfirmationEmail(data: EmailTemplateData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = getResendClient();
      const template = this.getConfirmationTemplate(data);
      
      const result = await client.emails.send({
        from: `${this.DEFAULT_FROM_NAME} <${this.FROM_EMAIL}>`,
        to: [data.applicantEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  // Send acceptance email
  static async sendAcceptanceEmail(data: EmailTemplateData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = getResendClient();
      const template = this.getAcceptanceTemplate(data);
      
      const result = await client.emails.send({
        from: `${this.DEFAULT_FROM_NAME} <${this.FROM_EMAIL}>`,
        to: [data.applicantEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending acceptance email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  // Send denial email
  static async sendDenialEmail(data: EmailTemplateData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const client = getResendClient();
      const template = this.getDenialTemplate(data);
      
      const result = await client.emails.send({
        from: `${this.DEFAULT_FROM_NAME} <${this.FROM_EMAIL}>`,
        to: [data.applicantEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Error sending denial email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }
}