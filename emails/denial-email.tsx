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

interface DenialEmailProps {
  communityName?: string;
  applicantName?: string;
  applicantEmail?: string;
  customDenialMessage?: string;
  formTitle?: string;
}

export const DenialEmail = ({
  communityName = 'Demo Community',
  applicantName = 'John Doe',
  applicantEmail = 'john@example.com',
  customDenialMessage = '',
  formTitle = 'Community Application Form',
}: DenialEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{communityName} Application Update</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 px-5 max-w-xl">
            {/* Header */}
            <Section className="bg-gradient-to-r from-gray-500 to-gray-600 p-8 text-center rounded-t-lg">
              <Heading className="text-2xl font-bold m-0 text-white">
                Application Update
              </Heading>
            </Section>

            {/* Content */}
            <Section className="bg-gray-50 p-8 rounded-b-lg">
              <Text className="text-gray-800 text-base leading-6">
                Hi {applicantName || 'there'},
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                Thank you for your interest in joining <strong>{communityName}</strong>.
              </Text>
              
              {/* Custom or default message */}
              <Section className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg my-5">
                <Text className="text-gray-800 m-0">
                  {customDenialMessage || 
                    "After careful consideration, we've decided not to move forward with your application at this time."
                  }
                </Text>
              </Section>
              
              <Text className="text-gray-800 text-base leading-6">
                We appreciate the time you took to apply and wish you the best in your endeavors.
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                Best regards,<br />
                <strong>{communityName} Team</strong>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-5 text-xs text-gray-500">
              <Text className="m-0">
                This email was sent to {applicantEmail}.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default DenialEmail;