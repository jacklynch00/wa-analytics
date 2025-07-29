import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface OrganizationInvitationProps {
  invitedByUsername?: string;
  invitedByEmail?: string;
  teamName?: string;
  inviteLink?: string;
  role?: string;
  recipientEmail?: string;
}

export const OrganizationInvitation = ({
  invitedByUsername = 'John Doe',
  invitedByEmail = 'john@example.com',
  teamName = 'Demo Team',
  inviteLink = 'https://example.com/invite/123',
  role = 'member',
  recipientEmail = 'jane@example.com',
}: OrganizationInvitationProps) => {
  return (
    <Html>
      <Head>
        <style>{`
          .cta-button:hover {
            background-color: #2563eb !important;
          }
        `}</style>
      </Head>
      <Preview>You're invited to join {teamName} on WhatsApp Analytics</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-5 px-5 max-w-2xl">
            <Section className="bg-white rounded-xl p-10 shadow-lg">
              {/* Header */}
              <Section className="text-center mb-8">
                <div className="w-15 h-15 bg-blue-500 rounded-full inline-flex items-center justify-center mb-5">
                  <Text className="text-white text-2xl font-bold m-0">WA</Text>
                </div>
                <Heading className="text-3xl font-bold m-0 mb-2 text-gray-900">
                  You're Invited!
                </Heading>
                <Text className="text-base m-0 text-gray-600">
                  Join your team on WhatsApp Analytics
                </Text>
              </Section>

              <Text className="text-gray-800 text-base leading-6">
                Hi there,
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                <strong>{invitedByUsername}</strong> ({invitedByEmail}) has invited you to join their team on WhatsApp Analytics.
              </Text>

              {/* Invitation Card */}
              <Section className="bg-gray-100 border-2 border-gray-200 rounded-lg p-6 text-center my-8">
                <Text className="text-gray-900 text-xl font-semibold m-0 mb-2">
                  {teamName}
                </Text>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide text-white ${
                  role === 'admin' ? 'bg-blue-500' : 'bg-gray-500'
                }`}>
                  {role} role
                </div>
              </Section>

              {/* Features */}
              <Section className="my-8">
                <Heading className="text-lg m-0 mb-4 text-gray-900">
                  What you'll get access to:
                </Heading>
                <ul className="text-gray-700 pl-0 list-none">
                  <li className="mb-2 pl-6 relative">
                    <span className="absolute left-0 text-green-500 font-bold">✓</span>
                    Collaborate on WhatsApp community analytics
                  </li>
                  <li className="mb-2 pl-6 relative">
                    <span className="absolute left-0 text-green-500 font-bold">✓</span>
                    Create and manage member directories
                  </li>
                  <li className="mb-2 pl-6 relative">
                    <span className="absolute left-0 text-green-500 font-bold">✓</span>
                    Build application forms for community members
                  </li>
                  <li className="mb-2 pl-6 relative">
                    <span className="absolute left-0 text-green-500 font-bold">✓</span>
                    Analyze chat exports and generate insights
                  </li>
                  {role === 'admin' && (
                    <li className="mb-2 pl-6 relative">
                      <span className="absolute left-0 text-green-500 font-bold">✓</span>
                      Manage team members and organization settings
                    </li>
                  )}
                </ul>
              </Section>

              {/* CTA Button */}
              <Section className="text-center my-8">
                <Button
                  href={inviteLink}
                  className="cta-button bg-blue-500 text-white py-4 px-8 rounded-lg font-semibold text-base no-underline inline-block transition-colors duration-200"
                >
                  Accept Invitation
                </Button>
              </Section>

              {/* Expiry Notice */}
              <Section className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 my-5">
                <Text className="text-yellow-800 text-sm m-0">
                  <strong>⏰ This invitation expires in 48 hours.</strong> Make sure to accept it soon!
                </Text>
              </Section>

              <Text className="text-gray-600 text-sm leading-5">
                If you're not expecting this invitation or don't want to join, you can safely ignore this email or decline the invitation.
              </Text>

              {/* Footer */}
              <Section className="mt-10 pt-5 border-t border-gray-200 text-center text-sm text-gray-600">
                <Text className="m-0 mb-2">
                  This email was sent to {recipientEmail}.
                </Text>
                <Text className="m-0">
                  <a href={inviteLink} className="text-blue-500 no-underline">Accept Invitation</a> | {' '}
                  <a href="https://usewaly.com" className="text-blue-500 no-underline">Waly</a>
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrganizationInvitation;