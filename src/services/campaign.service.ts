import {
    CampaignRecipientStatus,
    CampaignStatus,
    LogLevel,
    LogModule
} from "@prisma/client";

import { prisma } from "../config/prisma";
import { CreateCampaignInput } from "../validations/campaign.validation";
import { LogService } from "./log.service";

export class CampaignService {
    static async listCampaigns(workspaceId: string) {
        return prisma.campaign.findMany({
            where: {
                workspaceId
            },
            include: {
                template: true,
                _count: {
                    select: {
                        recipients: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    static async getCreateData(workspaceId: string) {
        const [templates, contacts] = await Promise.all([
            prisma.template.findMany({
                where: {
                    workspaceId,
                    status: "APPROVED"
                },
                orderBy: {
                    name: "asc"
                }
            }),

            prisma.contact.findMany({
                where: {
                    workspaceId,
                    isActive: true
                },
                orderBy: [
                    {
                        customName: "asc"
                    },
                    {
                        profileName: "asc"
                    },
                    {
                        phone: "asc"
                    }
                ],
                take: 500
            })
        ]);

        return {
            templates,
            contacts
        };
    }

    static async createCampaign(
        workspaceId: string,
        createdById: string,
        input: CreateCampaignInput
    ) {
        if (input.contactIds.length === 0) {
            throw new Error("Selecciona al menos un contacto.");
        }

        const template = await prisma.template.findFirst({
            where: {
                id: input.templateId,
                workspaceId,
                status: "APPROVED"
            }
        });

        if (!template) {
            throw new Error("Plantilla no encontrada o no aprobada.");
        }

        const contacts = await prisma.contact.findMany({
            where: {
                workspaceId,
                id: {
                    in: input.contactIds
                },
                isActive: true
            },
            select: {
                id: true,
                phone: true
            }
        });

        if (contacts.length === 0) {
            throw new Error("No hay contactos válidos para la campaña.");
        }

        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                templateId: template.id,
                createdById,
                name: input.name,
                status: CampaignStatus.DRAFT,
                totalRecipients: contacts.length,
                validRecipients: contacts.length,
                invalidRecipients: 0,
                duplicateRecipients: 0,
                recipients: {
                    create: contacts.map((contact) => ({
                        contactId: contact.id,
                        phone: contact.phone,
                        status: CampaignRecipientStatus.PENDING
                    }))
                }
            },
            include: {
                recipients: true
            }
        });

        await LogService.create({
            workspaceId,
            level: LogLevel.INFO,
            module: LogModule.CAMPAIGN,
            action: "CAMPAIGN_CREATED",
            message: "Campaña creada correctamente.",
            payload: {
                campaignId: campaign.id,
                name: campaign.name,
                recipients: campaign.recipients.length,
                templateId: template.id
            }
        });

        return campaign;
    }

    static async getCampaign(workspaceId: string, campaignId: string) {
        return prisma.campaign.findFirst({
            where: {
                id: campaignId,
                workspaceId
            },
            include: {
                template: true,
                createdBy: true,
                recipients: {
                    include: {
                        contact: true,
                        message: true
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });
    }
}