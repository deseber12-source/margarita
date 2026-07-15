import { LogLevel, LogModule } from "@prisma/client";

import { prisma } from "../config/prisma";

type CreateLogInput = {
    workspaceId?: string | null;
    level: LogLevel;
    module: LogModule;
    action: string;
    message: string;
    payload?: unknown;
};

export class LogService {
    static async create(input: CreateLogInput) {
        return prisma.log.create({
            data: {
                workspaceId: input.workspaceId || null,
                level: input.level,
                module: input.module,
                action: input.action,
                message: input.message,
                payload: input.payload === undefined ? undefined : input.payload
            }
        });
    }
}
