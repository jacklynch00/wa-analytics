import { NextRequest, NextResponse } from 'next/server';
import { memberApplicationService, applicationFormService } from '@/lib/application-forms';
import { EmailService } from '@/lib/email';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailType } = await request.json();

    if (!emailType || !['confirmation', 'acceptance', 'denial'].includes(emailType)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Get the application and verify ownership
    const application = await memberApplicationService.getApplicationById(applicationId);
    
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify that the user owns the community that owns the form
    const community = await prisma.community.findFirst({
      where: { 
        applicationForm: {
          id: application.formId
        },
        userId: session.user.id,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get form information
    const form = await applicationFormService.getFormById(application.formId);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Extract applicant name from responses if available
    const nameQuestion = form.questions.find(q => 
      q.label.toLowerCase().includes('name') && q.type === 'text'
    );
    const applicantName = nameQuestion 
      ? (Array.isArray(application.responses[nameQuestion.id]) 
          ? (application.responses[nameQuestion.id] as string[])[0]
          : application.responses[nameQuestion.id] as string)
      : undefined;

    const emailData = {
      communityName: form.title,
      applicantName,
      applicantEmail: application.email,
      whatsappInviteUrl: form.whatsappInviteUrl,
      customAcceptanceMessage: form.acceptanceMessage,
      customDenialMessage: form.denialMessage,
      formTitle: form.title,
    };

    let emailResult;
    let trackingField: string;

    // Send the appropriate email based on type
    switch (emailType) {
      case 'confirmation':
        emailResult = await EmailService.sendConfirmationEmail(emailData);
        trackingField = 'confirmation';
        break;
      case 'acceptance':
        if (application.status !== 'ACCEPTED') {
          return NextResponse.json({ error: 'Application must be accepted to send acceptance email' }, { status: 400 });
        }
        emailResult = await EmailService.sendAcceptanceEmail(emailData);
        trackingField = 'status';
        break;
      case 'denial':
        if (application.status !== 'DENIED') {
          return NextResponse.json({ error: 'Application must be denied to send denial email' }, { status: 400 });
        }
        emailResult = await EmailService.sendDenialEmail(emailData);
        trackingField = 'status';
        break;
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Log email result for debugging
    console.log('Email send result:', {
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error,
      emailType,
      applicationId,
      recipientEmail: application.email
    });

    // Update email tracking
    if (emailResult.success) {
      const trackingData: Record<string, unknown> = {};
      
      if (trackingField === 'confirmation') {
        trackingData.confirmationEmailSent = true;
        trackingData.confirmationEmailSentAt = new Date();
      } else {
        trackingData.statusEmailSent = true;
        trackingData.statusEmailSentAt = new Date();
      }

      await memberApplicationService.updateEmailTracking(applicationId, trackingData);
      
      return NextResponse.json({ 
        success: true, 
        message: `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} email sent successfully`,
        messageId: emailResult.messageId 
      });
    } else {
      console.error('Email send failed:', emailResult.error);
      
      // Track email error
      await memberApplicationService.updateEmailTracking(applicationId, {
        emailDeliveryErrors: [{ 
          type: emailType, 
          error: emailResult.error, 
          timestamp: new Date() 
        }]
      });

      return NextResponse.json({ 
        success: false, 
        error: emailResult.error || 'Failed to send email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error re-sending email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}