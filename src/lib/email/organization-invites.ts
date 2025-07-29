import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrganizationInvitation({
	email,
	invitedByUsername,
	invitedByEmail,
	teamName,
	inviteLink,
	role = 'member',
}: {
	email: string;
	invitedByUsername: string;
	invitedByEmail: string;
	teamName: string;
	inviteLink: string;
	role?: string;
}) {
	try {
		const result = await resend.emails.send({
			from: `${teamName || 'Waly'} community invite <${process.env.FROM_EMAIL!}>`,
			to: email,
			subject: `You're invited to join ${teamName} on WhatsApp Analytics`,
			html: generateInvitationEmailHTML({
				invitedByUsername,
				invitedByEmail,
				teamName,
				inviteLink,
				role,
				recipientEmail: email,
			}),
		});

		console.log('Invitation email sent successfully:', result);
		return result;
	} catch (error) {
		console.error('Failed to send invitation email:', error);
		throw new Error('Failed to send invitation email');
	}
}

function generateInvitationEmailHTML({
	invitedByUsername,
	invitedByEmail,
	teamName,
	inviteLink,
	role,
	recipientEmail,
}: {
	invitedByUsername: string;
	invitedByEmail: string;
	teamName: string;
	inviteLink: string;
	role: string;
	recipientEmail: string;
}) {
	return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation - WhatsApp Analytics</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #3b82f6;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .logo-text {
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        h1 {
          color: #1f2937;
          font-size: 28px;
          margin: 0 0 10px 0;
          font-weight: 700;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 0;
        }
        .invitation-card {
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 30px 0;
          text-align: center;
        }
        .team-name {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .role-badge {
          display: inline-block;
          background: ${role === 'admin' ? '#3b82f6' : '#6b7280'};
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .features {
          margin: 30px 0;
        }
        .features h3 {
          color: #1f2937;
          font-size: 18px;
          margin-bottom: 16px;
        }
        .features ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .features li {
          padding: 8px 0;
          color: #4b5563;
          position: relative;
          padding-left: 24px;
        }
        .features li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background: #2563eb;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .footer a {
          color: #3b82f6;
          text-decoration: none;
        }
        .expiry-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-text">WA</span>
          </div>
          <h1>You're Invited!</h1>
          <p class="subtitle">Join your team on WhatsApp Analytics</p>
        </div>

        <p>Hi there,</p>
        
        <p><strong>${invitedByUsername}</strong> (${invitedByEmail}) has invited you to join their team on WhatsApp Analytics.</p>

        <div class="invitation-card">
          <div class="team-name">${teamName}</div>
          <div class="role-badge">${role} role</div>
        </div>

        <div class="features">
          <h3>What you'll get access to:</h3>
          <ul>
            <li>Collaborate on WhatsApp community analytics</li>
            <li>Create and manage member directories</li>
            <li>Build application forms for community members</li>
            <li>Analyze chat exports and generate insights</li>
            ${role === 'admin' ? '<li>Manage team members and organization settings</li>' : ''}
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
        </div>

        <div class="expiry-notice">
          <strong>⏰ This invitation expires in 48 hours.</strong> Make sure to accept it soon!
        </div>

        <p>If you're not expecting this invitation or don't want to join, you can safely ignore this email or decline the invitation.</p>

        <div class="footer">
          <p>This email was sent to ${recipientEmail}.</p>
          <p>
            <a href="${inviteLink}">Accept Invitation</a> | 
            <a href="https://usewaly.com">Waly</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Function to send welcome email after successful invitation acceptance
export async function sendWelcomeEmail({ email, username, teamName, role }: { email: string; username: string; teamName: string; role: string }) {
	try {
		const result = await resend.emails.send({
			from: `${teamName || 'Waly'} community welcome <${process.env.FROM_EMAIL!}>`,
			to: email,
			subject: `Welcome to ${teamName}! 🎉`,
			html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${teamName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              text-align: center;
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 20px;
            }
            h1 {
              color: #1f2937;
              font-size: 28px;
              margin: 0 0 20px 0;
            }
            .cta-button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">
              <span style="color: white; font-size: 32px;">✓</span>
            </div>
            <h1>Welcome to ${teamName}!</h1>
            <p>Hi ${username},</p>
            <p>You've successfully joined <strong>${teamName}</strong> as a <strong>${role}</strong>. You now have access to all team analytics and collaboration features.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
              Go to Dashboard
            </a>
            <p>If you have any questions, feel free to reach out to your team admin.</p>
          </div>
        </body>
        </html>
      `,
		});

		console.log('Welcome email sent successfully:', result);
		return result;
	} catch (error) {
		console.error('Failed to send welcome email:', error);
		// Don't throw error - welcome email is not critical
	}
}
