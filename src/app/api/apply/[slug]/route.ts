import { NextRequest, NextResponse } from 'next/server';
import { applicationFormService, memberApplicationService } from '@/lib/application-forms';
import { EmailService } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get the form by slug
    const form = await applicationFormService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check for submission cooldown using email from cookies if available
    // This is a basic check - more sophisticated cooldown will be in POST
    const submittedCookie = request.cookies.get(`submitted_${form.id}`);
    const hasCooldown = !!submittedCookie;

    return NextResponse.json({ 
      form,
      hasCooldown 
    });
  } catch (error) {
    console.error('Error fetching public form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { responses } = await request.json();

    // Get the form by slug
    const form = await applicationFormService.getFormBySlug(slug);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Check if form is active
    if (!form.isActive) {
      return NextResponse.json({ error: 'This form is no longer accepting submissions' }, { status: 400 });
    }

    // Validate responses
    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    // Extract email from responses (should be the first question)
    const emailQuestion = form.questions[0];
    const email = responses[emailQuestion.id];

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check submission cooldown
    const hasCooldown = await memberApplicationService.checkSubmissionCooldown(form.id, email);
    if (hasCooldown) {
      return NextResponse.json({ 
        error: 'You have already submitted an application recently. Please wait 5 days before submitting again.' 
      }, { status: 429 });
    }

    // Validate required fields
    for (const question of form.questions) {
      if (question.required) {
        const response = responses[question.id];
        if (!response || 
            (Array.isArray(response) && response.length === 0) ||
            (typeof response === 'string' && response.trim().length === 0)) {
          return NextResponse.json({ 
            error: `Please answer the required question: ${question.label}` 
          }, { status: 400 });
        }
      }
    }

    // Create the application
    const application = await memberApplicationService.createApplication({
      formId: form.id,
      email: email.trim().toLowerCase(),
      responses,
      status: 'PENDING',
    });

    // Send confirmation email
    try {
      // Get community info for email
      const formWithCommunity = await applicationFormService.getFormById(form.id);
      
      if (formWithCommunity) {
        // Extract applicant name from responses if available
        const nameQuestion = form.questions.find(q => 
          q.label.toLowerCase().includes('name') && q.type === 'text'
        );
        const applicantName = nameQuestion ? responses[nameQuestion.id] : undefined;

        const emailResult = await EmailService.sendConfirmationEmail({
          communityName: formWithCommunity.title, // Using form title as community identifier
          applicantName,
          applicantEmail: email.trim().toLowerCase(),
          whatsappInviteUrl: form.whatsappInviteUrl,
          formTitle: form.title,
        });

        // Update email tracking
        if (emailResult.success) {
          await memberApplicationService.updateEmailTracking(application.id, {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date(),
          });
        } else {
          await memberApplicationService.updateEmailTracking(application.id, {
            emailDeliveryErrors: [{ 
              type: 'confirmation', 
              error: emailResult.error, 
              timestamp: new Date() 
            }]
          });
        }
      }
    } catch (emailError) {
      // Log email error but don't fail the application submission
      console.error('Failed to send confirmation email:', emailError);
      
      // Track email error
      try {
        await memberApplicationService.updateEmailTracking(application.id, {
          emailDeliveryErrors: [{ 
            type: 'confirmation', 
            error: emailError instanceof Error ? emailError.message : 'Unknown error', 
            timestamp: new Date() 
          }]
        });
      } catch (trackingError) {
        console.error('Failed to track email error:', trackingError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Application submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}