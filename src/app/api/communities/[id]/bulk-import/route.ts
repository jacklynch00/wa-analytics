import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  id: string;
}

interface FormQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface BulkMemberData {
  responses: Record<string, string>;
  status: 'PENDING' | 'ACCEPTED' | 'DENIED';
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { id: communityId } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { members }: { members: BulkMemberData[] } = await request.json();

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'No members provided' }, { status: 400 });
    }

    // Verify the community belongs to the user and get application form
    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        userId: session.user.id,
      },
      include: {
        applicationForm: true,
      },
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    if (!community.applicationForm) {
      return NextResponse.json({ error: 'Community does not have an application form' }, { status: 400 });
    }

    // Get the form questions from the JSON field
    const formQuestions = (community.applicationForm.questions as unknown as FormQuestion[]) || [];

    // Validate that all required questions are answered
    const requiredQuestionIds = formQuestions
      .filter((q: FormQuestion) => q.required)
      .map((q: FormQuestion) => q.id);

    const invalidMembers: number[] = [];
    const validMembers: BulkMemberData[] = [];

    members.forEach((member, index) => {
      const missingRequired = requiredQuestionIds.some(qId => 
        !member.responses[qId] || member.responses[qId].trim() === ''
      );

      if (missingRequired) {
        invalidMembers.push(index + 1);
      } else {
        validMembers.push(member);
      }
    });

    if (invalidMembers.length > 0) {
      return NextResponse.json({
        error: `Members at rows ${invalidMembers.join(', ')} are missing required fields`,
        invalidRows: invalidMembers
      }, { status: 400 });
    }

    // Separate existing form questions from new dynamic fields
    const newFieldsToCreate: { label: string; type: string }[] = [];
    const processedResponses = validMembers.map(member => {
      const existingResponses: Record<string, string> = {};
      const dynamicFields: Record<string, string> = {};

      Object.entries(member.responses).forEach(([key, value]) => {
        if (key.startsWith('new:')) {
          // This is a dynamic field - extract the field name
          const fieldName = key.replace('new:', '');
          dynamicFields[fieldName] = value;
          
          // Add to fields to create if not already added
          if (!newFieldsToCreate.some(f => f.label === fieldName)) {
            newFieldsToCreate.push({
              label: fieldName,
              type: 'text' // Default to text type for dynamic fields
            });
          }
        } else {
          // This is an existing form question
          existingResponses[key] = value;
        }
      });

      return {
        ...member,
        existingResponses,
        dynamicFields
      };
    });

    // Create new form questions for dynamic fields by updating the JSON
    const createdQuestions: { [fieldName: string]: string } = {};
    if (newFieldsToCreate.length > 0) {
      const updatedQuestions = [...formQuestions];
      
      for (const field of newFieldsToCreate) {
        const newQuestionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newQuestion = {
          id: newQuestionId,
          label: field.label,
          type: field.type,
          required: false,
          placeholder: `Enter ${field.label}`,
          options: []
        };
        
        updatedQuestions.push(newQuestion);
        createdQuestions[field.label] = newQuestionId;
      }
      
      // Update the application form with new questions
      await prisma.applicationForm.update({
        where: { id: community.applicationForm!.id },
        data: { questions: updatedQuestions as unknown as never }
      });
    }

    // Extract emails for duplicate checking (from both existing and new fields)
    const emailQuestion = formQuestions.find((q: FormQuestion) => 
      q.label.toLowerCase().includes('email')
    );

    const getEmailFromMember = (member: { existingResponses: Record<string, string>; dynamicFields: Record<string, string> }) => {
      // Try existing email question first
      if (emailQuestion && member.existingResponses[emailQuestion.id]) {
        return member.existingResponses[emailQuestion.id].toLowerCase();
      }
      
      // Try dynamic email field
      const emailField = Object.keys(member.dynamicFields).find(key => 
        key.toLowerCase().includes('email')
      );
      if (emailField && member.dynamicFields[emailField]) {
        return member.dynamicFields[emailField].toLowerCase();
      }
      
      return null;
    };

    const emails = processedResponses.map(getEmailFromMember).filter((email): email is string => email !== null);
    
    // Check for existing applications with these emails
    const existingApplications = await prisma.memberApplication.findMany({
      where: {
        form: {
          communityId: communityId,
        },
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    });

    const existingEmailSet = new Set(existingApplications.map(app => app.email.toLowerCase()));
    const duplicates: string[] = [];
    const membersToCreate: { existingResponses: Record<string, string>; dynamicFields: Record<string, string>; status: 'PENDING' | 'ACCEPTED' | 'DENIED' }[] = [];

    processedResponses.forEach(member => {
      const email = getEmailFromMember(member);
      if (email && existingEmailSet.has(email)) {
        duplicates.push(email);
      } else {
        membersToCreate.push(member);
      }
    });

    // Create applications for non-duplicate members
    const createdApplications = await prisma.$transaction(
      membersToCreate.map(member => {
        const email = getEmailFromMember(member) || 'no-email@example.com';
        
        // Merge existing responses with dynamic field responses (using their new question IDs)
        const finalResponses = { ...member.existingResponses };
        Object.entries(member.dynamicFields).forEach(([fieldName, value]) => {
          if (createdQuestions[fieldName]) {
            finalResponses[createdQuestions[fieldName]] = value;
          }
        });

        return prisma.memberApplication.create({
          data: {
            email: email,
            status: member.status,
            responses: finalResponses,
            form: {
              connect: {
                id: community.applicationForm!.id,
              },
            },
          },
        });
      })
    );

    return NextResponse.json({
      imported: createdApplications.length,
      duplicates: duplicates.length,
      duplicateEmails: duplicates,
      newFieldsCreated: newFieldsToCreate.length,
      newFields: newFieldsToCreate.map(f => f.label),
      total: members.length,
      message: `Successfully imported ${createdApplications.length} members${duplicates.length > 0 ? `. ${duplicates.length} duplicates were skipped.` : ''}${newFieldsToCreate.length > 0 ? ` Created ${newFieldsToCreate.length} new fields.` : ''}`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import members' },
      { status: 500 }
    );
  }
}