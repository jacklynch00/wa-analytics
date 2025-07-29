import {
  Body,
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

interface ConfirmationEmailProps {
  communityName?: string;
  applicantName?: string;
  applicantEmail?: string;
  whatsappInviteUrl?: string;
  formTitle?: string;
}

export const ConfirmationEmail = ({
  communityName = 'Demo Community',
  applicantName = 'John Doe',
  applicantEmail = 'john@example.com',
  whatsappInviteUrl = 'https://chat.whatsapp.com/example',
  formTitle = 'Community Application Form',
}: ConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Application Received - {communityName}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 px-5 max-w-xl">
            {/* Header */}
            <Section className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center rounded-t-lg">
              <Heading className="text-2xl font-bold m-0 text-white">
                Application Received!
              </Heading>
            </Section>

            {/* Content */}
            <Section className="bg-gray-50 p-8 rounded-b-lg">
              <Text className="text-gray-800 text-base leading-6">
                Hi there,
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                Thank you for applying to join <strong>{communityName}</strong>.
              </Text>
              
              {/* What happens next box */}
              <Section className="bg-blue-50 border-l-4 border-blue-400 p-4 my-5">
                <Text className="text-gray-800 font-bold m-0 mb-2">
                  What happens next?
                </Text>
                <ul className="text-gray-800 pl-5 mt-2 mb-0">
                  <li className="mb-2">
                    We've received your application and will review it shortly
                  </li>
                  <li className="mb-2">
                    You'll receive an email notification with our decision
                  </li>
                  {whatsappInviteUrl && (
                    <li className="mb-2">
                      If accepted, you'll receive a WhatsApp group invitation
                    </li>
                  )}
                </ul>
              </Section>
              
              <Text className="text-gray-800 text-base leading-6">
                We appreciate your interest and will get back to you soon!
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                Best regards,<br />
                <strong>{communityName} Team</strong>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-5 text-xs text-gray-500">
              <Text className="m-0">
                This is an automated message from {communityName}. Please do not reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ConfirmationEmail;