import axios from "axios";
import { LogLevel, LogModule } from "@prisma/client";

import { prisma } from "../config/prisma";
import { LogService } from "./log.service";

type MetaTemplate = {
    id?: string;
    name: string;
    language: string;
    category?: string;
    status: string;
    components?: unknown;
};

export class TemplateService {
    static async listTemplates(workspaceId: string) {
        return prisma.template.findMany({
            where: {
                workspaceId
            },
            orderBy: [
                {
                    status: "asc"
                },
                {
                    name: "asc"
                }
            ]
        });
    }

    static async listApprovedTemplates(workspaceId: string) {
        return prisma.template.findMany({
            where: {
                workspaceId,
                status: "APPROVED"
            },
            orderBy: {
                name: "asc"
            }
        });
    }

    static async syncTemplates(workspaceId: string) {
        const account = await prisma.whatsAppAccount.findUnique({
            where: {
                workspaceId
            }
        });

        if (!account) {
            throw new Error("No hay cuenta de WhatsApp configurada.");
        }

        const url = `https://graph.facebook.com/${account.apiVersion}/${account.businessAccountId}/message_templates`;

        try {
            const response = await axios.get(url, {
                params: {
                    fields: "id,name,language,category,status,components",
                    access_token: account.accessToken
                },
                timeout: 15000
            });

            const templates = Array.isArray(response.data?.data)
                ? (response.data.data as MetaTemplate[])
                : [];

            let syncedCount = 0;

            for (const template of templates) {
                if (!template.name || !template.language || !template.status) {
                    continue;
                }

                await prisma.template.upsert({
                    where: {
                        workspaceId_name_language: {
                            workspaceId,
                            name: template.name,
                            language: template.language
                        }
                    },
                    update: {
                        metaTemplateId: template.id || null,
                        category: template.category || null,
                        status: template.status,
                        components:
                            template.components === undefined
                                ? undefined
                                : template.components,
                        lastSyncedAt: new Date()
                    },
                    create: {
                        workspaceId,
                        metaTemplateId: template.id || null,
                        name: template.name,
                        language: template.language,
                        category: template.category || null,
                        status: template.status,
                        components:
                            template.components === undefined
                                ? undefined
                                : template.components,
                        lastSyncedAt: new Date()
                    }
                });

                syncedCount++;
            }

            await LogService.create({
                workspaceId,
                level: LogLevel.INFO,
                module: LogModule.META,
                action: "TEMPLATES_SYNC_SUCCESS",
                message: `Se sincronizaron ${syncedCount} plantillas desde Meta.`,
                payload: {
                    syncedCount
                }
            });

            return {
                ok: true,
                syncedCount
            };
        } catch (error) {
            const errorPayload =
                axios.isAxiosError(error)
                    ? {
                          status: error.response?.status,
                          data: error.response?.data,
                          message: error.message
                      }
                    : {
                          message:
                              error instanceof Error
                                  ? error.message
                                  : "Error desconocido"
                      };

            await LogService.create({
                workspaceId,
                level: LogLevel.ERROR,
                module: LogModule.META,
                action: "TEMPLATES_SYNC_FAILED",
                message: "No se pudieron sincronizar plantillas desde Meta.",
                payload: errorPayload
            });

            throw new Error("No se pudieron sincronizar plantillas desde Meta.");
        }
    }
}
