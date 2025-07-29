import { NextRequest, NextResponse } from 'next/server';
import { memberApplicationService, applicationFormService } from '@/lib/application-forms';
import { EmailService } from '@/lib/email';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
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

    const { status } = await request.json();

    if (!status || !['PENDING', 'ACCEPTED', 'DENIED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
        createdBy: session.user.id,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the application status
    const updatedApplication = await memberApplicationService.updateApplicationStatus(
      applicationId, 
      status,
      session.user.id
    );

    // Send email notification for status change
    if (status === 'ACCEPTED' || status === 'DENIED') {
      try {
        // Get form and community information
        const form = await applicationFormService.getFormById(application.formId);
        
        if (form) {
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
          if (status === 'ACCEPTED') {
            emailResult = await EmailService.sendAcceptanceEmail(emailData);
          } else {
            emailResult = await EmailService.sendDenialEmail(emailData);
          }

          // Update email tracking
          if (emailResult.success) {
            await memberApplicationService.updateEmailTracking(applicationId, {
              statusEmailSent: true,
              statusEmailSentAt: new Date(),
            });
          } else {
            await memberApplicationService.updateEmailTracking(applicationId, {
              emailDeliveryErrors: [{ 
                type: status.toLowerCase(), 
                error: emailResult.error, 
                timestamp: new Date() 
              }]
            });
          }
        }
      } catch (emailError) {
        // Log email error but don't fail the status update
        console.error(`Failed to send ${status.toLowerCase()} email:`, emailError);
        
        // Track email error
        try {
          await memberApplicationService.updateEmailTracking(applicationId, {
            emailDeliveryErrors: [{ 
              type: status.toLowerCase(), 
              error: emailError instanceof Error ? emailError.message : 'Unknown error', 
              timestamp: new Date() 
            }]
          });
        } catch (trackingError) {
          console.error('Failed to track email error:', trackingError);
        }
      }
    }

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}