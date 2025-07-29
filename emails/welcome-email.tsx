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

interface WelcomeEmailProps {
  username?: string;
  teamName?: string;
  role?: string;
  email?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  username = 'John Doe',
  teamName = 'Demo Team',
  role = 'member',
  email = 'john@example.com',
  dashboardUrl = 'http://localhost:3000/dashboard',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head>
        <style>{`
          .dashboard-button:hover {
            background-color: #2563eb !important;
          }
        `}</style>
      </Head>
      <Preview>Welcome to {teamName}! 🎉</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto py-5 px-5 max-w-xl">
            <Section className="bg-white rounded-xl p-10 shadow-lg text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-500 rounded-full inline-flex items-center justify-center mb-5">
                <Text className="text-white text-3xl m-0">✓</Text>
              </div>
              
              <Heading className="text-3xl font-bold m-0 mb-5 text-gray-900">
                Welcome to {teamName}!
              </Heading>
              
              <Text className="text-gray-800 text-base leading-6">
                Hi {username},
              </Text>
              
              <Text className="text-gray-800 text-base leading-6">
                You've successfully joined <strong>{teamName}</strong> as a <strong>{role}</strong>. 
                You now have access to all team analytics and collaboration features.
              </Text>
              
              <Section className="my-8">
                <Button
                  href={dashboardUrl}
                  className="dashboard-button bg-blue-500 text-white py-4 px-8 rounded-lg font-semibold text-base no-underline inline-block transition-colors duration-200"
                >
                  Go to Dashboard
                </Button>
              </Section>
              
              <Text className="text-gray-600 text-sm leading-5">
                If you have any questions, feel free to reach out to your team admin.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;