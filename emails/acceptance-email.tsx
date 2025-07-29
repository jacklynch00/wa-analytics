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

interface AcceptanceEmailProps {
  communityName?: string;
  applicantName?: string;
  applicantEmail?: string;
  whatsappInviteUrl?: string;
  customAcceptanceMessage?: string;
  formTitle?: string;
}

export const AcceptanceEmail = ({
  communityName = 'Demo Community',
  applicantName = 'John Doe',
  applicantEmail = 'john@example.com',
  whatsappInviteUrl = 'https://chat.whatsapp.com/example',
  customAcceptanceMessage = '',
  formTitle = 'Community Application Form',
}: AcceptanceEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {communityName}! 🎉</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 px-5 max-w-xl">
            {/* Header */}
            <Section className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center rounded-t-lg">
              <Heading className="text-3xl font-bold m-0 mb-2 text-white">
                🎉 Congratulations!
              </Heading>
              <Text className="text-lg m-0 text-white">
                You've been accepted!
              </Text>
            </Section>

            {/* Content */}
            <Section className="bg-gray-50 p-8 rounded-b-lg">
              <Text className="text-gray-800 text-base leading-6">
                Hi {applicantName || 'there'},
              </Text>
              
              {/* Success box */}
              <Section className="bg-green-100 border border-green-300 text-green-800 p-5 rounded-lg my-5">
                <Text className="text-lg font-bold m-0">
                  Great news! Your application to join {communityName} has been accepted.
                </Text>
              </Section>
              
              {/* Custom message */}
              {customAcceptanceMessage && (
                <Section className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg my-5">
                  <Text className="text-gray-800 m-0">
                    {customAcceptanceMessage}
                  </Text>
                </Section>
              )}
              
              {/* WhatsApp invitation */}
              {whatsappInviteUrl && (
                <>
                  <Text className="text-gray-800 text-base leading-6">
                    <strong>Next Step:</strong> Join our WhatsApp community to connect with other members:
                  </Text>
                  <Section className="text-center my-5">
                    <Button
                      href={whatsappInviteUrl}
                      className="bg-green-500 text-white py-4 px-8 rounded-lg font-bold text-base no-underline inline-block"
                    >
                      📱 Join WhatsApp Group
                    </Button>
                  </Section>
                  <Text className="text-sm text-gray-600 italic">
                    If the button doesn't work, copy and paste this link: {whatsappInviteUrl}
                  </Text>
                </>
              )}
              
              <Text className="text-gray-800 text-base leading-6">
                Welcome aboard! We're excited to have you as part of our community.
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                Best regards,<br />
                <strong>{communityName} Team</strong>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-5 text-xs text-gray-500">
              <Text className="m-0">
                This email was sent to {applicantEmail}. Welcome to {communityName}!
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AcceptanceEmail;