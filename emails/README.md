# Email Templates

This directory contains React Email templates for the WhatsApp Analytics application.

## Getting Started

### Prerequisites
- React Email is already installed as a dev dependency
- All email templates are built using React Email components and Tailwind CSS

### Running the Email Preview Server

To preview all email templates locally:

```bash
npm run email
```

This will start the React Email development server at `http://localhost:3000` where you can:
- View all email templates
- See live previews as you edit
- Test different props and data scenarios
- Export templates as HTML

## Available Templates

### 1. Confirmation Email (`confirmation-email.tsx`)
Sent when a user submits a community application form.

**Props:**
- `communityName`: Name of the community
- `applicantName`: Name of the applicant
- `applicantEmail`: Email of the applicant
- `whatsappInviteUrl`: WhatsApp group invite URL (optional)
- `formTitle`: Title of the application form

### 2. Acceptance Email (`acceptance-email.tsx`)
Sent when an application is approved.

**Props:**
- `communityName`: Name of the community
- `applicantName`: Name of the applicant
- `applicantEmail`: Email of the applicant
- `whatsappInviteUrl`: WhatsApp group invite URL (optional)
- `customAcceptanceMessage`: Custom message from admin (optional)
- `formTitle`: Title of the application form

### 3. Denial Email (`denial-email.tsx`)
Sent when an application is rejected.

**Props:**
- `communityName`: Name of the community
- `applicantName`: Name of the applicant
- `applicantEmail`: Email of the applicant
- `customDenialMessage`: Custom message from admin (optional)
- `formTitle`: Title of the application form

### 4. Organization Invitation (`organization-invitation.tsx`)
Sent when inviting users to join an organization/team.

**Props:**
- `invitedByUsername`: Name of the person sending the invite
- `invitedByEmail`: Email of the person sending the invite
- `teamName`: Name of the organization/team
- `inviteLink`: Link to accept the invitation
- `role`: Role being assigned ('admin' or 'member')
- `recipientEmail`: Email of the person being invited

### 5. Welcome Email (`welcome-email.tsx`)
Sent after a user successfully joins an organization.

**Props:**
- `username`: Name of the new team member
- `teamName`: Name of the organization/team
- `role`: User's role in the organization
- `email`: User's email address
- `dashboardUrl`: Link to the dashboard

## Development

### Editing Templates
1. Start the email server: `npm run email`
2. Open `http://localhost:3000` in your browser
3. Edit any `.tsx` file in this directory
4. Changes will be reflected immediately in the preview

### Using Templates in Code
Templates are exported from `index.tsx` and can be imported like:

```typescript
import { ConfirmationEmail, AcceptanceEmail } from '../emails';
```

### Testing with Different Data
Each template includes default props for easy testing. You can modify these in the template files or use the example data from `index.tsx`.

## Integration with Resend

The current email service (`src/lib/email.ts`) uses HTML strings. To integrate these React Email components:

1. Install React Email's render function:
   ```bash
   npm install @react-email/render
   ```

2. Update the email service to use React components:
   ```typescript
   import { render } from '@react-email/render';
   import { ConfirmationEmail } from '../emails';
   
   const html = render(ConfirmationEmail({ 
     communityName: 'My Community',
     applicantName: 'John Doe',
     // ... other props
   }));
   ```

## Features

- **Responsive Design**: All templates work well on desktop and mobile
- **Tailwind CSS**: Styled with Tailwind for consistency
- **Accessibility**: Proper semantic HTML and alt tags
- **Dark Mode Support**: Templates adapt to email client preferences
- **Cross-client Compatibility**: Tested across major email clients

## File Structure

```
emails/
├── README.md                    # This file
├── index.tsx                   # Exports and example data
├── confirmation-email.tsx      # Application confirmation template
├── acceptance-email.tsx        # Application acceptance template
├── denial-email.tsx           # Application denial template
├── organization-invitation.tsx # Team invitation template
└── welcome-email.tsx          # Welcome to team template
```