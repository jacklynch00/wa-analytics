import { PrismaClient } from '@prisma/client';
import { ApplicationFormData, MemberApplicationData, FormQuestion } from '@/types';

const prisma = new PrismaClient();

export class ApplicationFormService {
  async createForm(data: Omit<ApplicationFormData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApplicationFormData> {
    const form = await prisma.applicationForm.create({
      data: {
        ...data,
        questions: data.questions as any,
      },
    });

    return this.transformFormData(form);
  }

  async getFormById(id: string): Promise<ApplicationFormData | null> {
    const form = await prisma.applicationForm.findUnique({
      where: { id },
      include: {
        community: true,
      },
    });

    if (!form) return null;
    return this.transformFormData(form);
  }

  async getFormByCommunityId(communityId: string): Promise<ApplicationFormData | null> {
    const form = await prisma.applicationForm.findUnique({
      where: { communityId },
      include: {
        community: true,
      },
    });

    if (!form) return null;
    return this.transformFormData(form);
  }

  async getFormBySlug(slug: string): Promise<ApplicationFormData | null> {
    const form = await prisma.applicationForm.findUnique({
      where: { customSlug: slug },
      include: {
        community: true,
      },
    });

    if (!form) return null;
    return this.transformFormData(form);
  }

  async updateForm(id: string, data: Partial<Omit<ApplicationFormData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApplicationFormData> {
    const form = await prisma.applicationForm.update({
      where: { id },
      data: {
        ...data,
        questions: data.questions ? (data.questions as any) : undefined,
      },
    });

    return this.transformFormData(form);
  }

  async deleteForm(id: string): Promise<void> {
    await prisma.applicationForm.delete({
      where: { id },
    });
  }

  async validateSlug(slug: string, excludeFormId?: string): Promise<boolean> {
    const RESERVED_SLUGS = ['admin', 'api', 'auth', 'apply', 'dashboard', 'login', 'signup', 'communities', 'users'];
    const SLUG_REGEX = /^[a-zA-Z0-9-]+$/;

    if (!SLUG_REGEX.test(slug) || 
        RESERVED_SLUGS.includes(slug.toLowerCase()) ||
        slug.length < 3 || 
        slug.length > 50) {
      return false;
    }

    const existingForm = await prisma.applicationForm.findUnique({
      where: { customSlug: slug },
    });

    if (existingForm && existingForm.id !== excludeFormId) {
      return false;
    }

    return true;
  }

  private transformFormData(form: any): ApplicationFormData {
    return {
      id: form.id,
      communityId: form.communityId,
      title: form.title,
      description: form.description,
      isActive: form.isActive,
      isPublic: form.isPublic,
      password: form.password,
      customSlug: form.customSlug,
      whatsappInviteUrl: form.whatsappInviteUrl,
      acceptanceMessage: form.acceptanceMessage,
      denialMessage: form.denialMessage,
      questions: form.questions as FormQuestion[],
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}

export class MemberApplicationService {
  async createApplication(data: Omit<MemberApplicationData, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemberApplicationData> {
    const application = await prisma.memberApplication.create({
      data: {
        ...data,
        responses: data.responses as any,
      },
    });

    return this.transformApplicationData(application);
  }

  async getApplicationById(id: string): Promise<MemberApplicationData | null> {
    const application = await prisma.memberApplication.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            community: true,
          },
        },
      },
    });

    if (!application) return null;
    return this.transformApplicationData(application);
  }

  async getApplicationsByFormId(formId: string, filters?: {
    status?: 'PENDING' | 'ACCEPTED' | 'DENIED';
    search?: string;
  }): Promise<MemberApplicationData[]> {
    const where: any = { formId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.email = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const applications = await prisma.memberApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        form: {
          include: {
            community: true,
          },
        },
      },
    });

    return applications.map(this.transformApplicationData);
  }

  async updateApplicationStatus(
    id: string, 
    status: 'PENDING' | 'ACCEPTED' | 'DENIED',
    reviewedBy?: string
  ): Promise<MemberApplicationData> {
    const application = await prisma.memberApplication.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        invitedAt: status === 'ACCEPTED' ? new Date() : undefined,
      },
    });

    return this.transformApplicationData(application);
  }

  async bulkUpdateApplicationStatus(
    applicationIds: string[],
    status: 'PENDING' | 'ACCEPTED' | 'DENIED',
    reviewedBy?: string
  ): Promise<number> {
    const result = await prisma.memberApplication.updateMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy,
        invitedAt: status === 'ACCEPTED' ? new Date() : undefined,
      },
    });

    return result.count;
  }

  async checkSubmissionCooldown(formId: string, email: string): Promise<boolean> {
    const COOLDOWN_HOURS = 120; // 5 days
    const cooldownDate = new Date();
    cooldownDate.setHours(cooldownDate.getHours() - COOLDOWN_HOURS);

    const recentApplication = await prisma.memberApplication.findFirst({
      where: {
        formId,
        email,
        createdAt: {
          gte: cooldownDate,
        },
      },
    });

    return !!recentApplication;
  }

  async updateEmailTracking(
    applicationId: string, 
    trackingData: {
      confirmationEmailSent?: boolean;
      confirmationEmailSentAt?: Date;
      statusEmailSent?: boolean;
      statusEmailSentAt?: Date;
      emailDeliveryErrors?: any[];
    }
  ): Promise<void> {
    await prisma.memberApplication.update({
      where: { id: applicationId },
      data: {
        ...trackingData,
        emailDeliveryErrors: trackingData.emailDeliveryErrors 
          ? trackingData.emailDeliveryErrors as any
          : undefined,
      },
    });
  }

  private transformApplicationData(application: any): MemberApplicationData {
    return {
      id: application.id,
      formId: application.formId,
      email: application.email,
      responses: application.responses,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      reviewedAt: application.reviewedAt,
      reviewedBy: application.reviewedBy,
      invitedAt: application.invitedAt,
    };
  }
}

export const applicationFormService = new ApplicationFormService();
export const memberApplicationService = new MemberApplicationService();