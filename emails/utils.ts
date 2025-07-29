// Email Templates for WhatsApp Analytics

export { default as ConfirmationEmail } from './confirmation-email';
export { default as AcceptanceEmail } from './acceptance-email';
export { default as DenialEmail } from './denial-email';
export { default as OrganizationInvitation } from './organization-invitation';
export { default as WelcomeEmail } from './welcome-email';

// Example data for previewing templates
export const exampleData = {
	confirmation: {
		communityName: 'Tech Innovators Community',
		applicantName: 'John Doe',
		applicantEmail: 'john.doe@example.com',
		whatsappInviteUrl: 'https://chat.whatsapp.com/example123',
		formTitle: 'Join Our Community',
	},
	acceptance: {
		communityName: 'Tech Innovators Community',
		applicantName: 'John Doe',
		applicantEmail: 'john.doe@example.com',
		whatsappInviteUrl: 'https://chat.whatsapp.com/example123',
		customAcceptanceMessage: 'We were impressed by your background in machine learning and look forward to your contributions to our AI working group.',
		formTitle: 'Join Our Community',
	},
	denial: {
		communityName: 'Tech Innovators Community',
		applicantName: 'John Doe',
		applicantEmail: 'john.doe@example.com',
		customDenialMessage: 'While your application showed promise, we currently have limited capacity. We encourage you to apply again in 6 months.',
		formTitle: 'Join Our Community',
	},
	organizationInvite: {
		invitedByUsername: 'Sarah Johnson',
		invitedByEmail: 'sarah@techcorp.com',
		teamName: 'TechCorp Analytics Team',
		inviteLink: 'https://app.waly.com/accept-invitation/abc123',
		role: 'admin',
		recipientEmail: 'john.doe@example.com',
	},
	welcome: {
		username: 'John Doe',
		teamName: 'TechCorp Analytics Team',
		role: 'admin',
		email: 'john.doe@example.com',
		dashboardUrl: 'https://app.waly.com/dashboard',
	},
};
