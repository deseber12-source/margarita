import { Request, Response } from "express";


import { sendFreeTextMessageSchema } from "../validations/free-text-message.validation";
import { TemplateService } from "../services/template.service";
import { sendTemplateMessageSchema } from "../validations/template-message.validation";
import { ConversationService } from "../services/conversation.service";
import { UserService } from "../services/user.service";
import { assignConversationSchema } from "../validations/conversation.validation";
import { MessageService } from "../services/message.service";
import { sendLocalMessageSchema } from "../validations/message.validation";
import { getRequiredParam } from "../utils/request";


export class AdminConversationsController {
    static async index(req: Request, res: Response) {
        const status =
            typeof req.query.status === "string" && req.query.status !== ""
                ? req.query.status
                : undefined;

        const conversations = await ConversationService.listConversations({
            workspaceId: req.user!.workspaceId,
            role: "ADMIN",
            status
        });

        return res.render("pages/admin/conversations/index", {
            user: req.user,
            conversations,
            status: status || "",
            success: req.query.success || null,
            error: req.query.error || null
        });
    }

    // falta identar

static async sendFreeTextMessage(req: Request, res: Response) {
    const parsed = sendFreeTextMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=free_text`
        );
    }

    try {
        await MessageService.sendFreeTextMessage({
            workspaceId: req.user!.workspaceId,
            conversationId: req.params.id,
            userId: req.user!.id,
            role: req.user!.role,
            input: parsed.data
        });

        return res.redirect(
            `/admin/conversations/${req.params.id}?success=free_text`
        );
    } catch {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=free_text`
        );
    }
}

    static async sendLocalMessage(req: Request, res: Response) {
    const parsed = sendLocalMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=message`
        );
    }

    try {
        await MessageService.sendLocalMessage({
            workspaceId: req.user!.workspaceId,
            conversationId: req.params.id,
            userId: req.user!.id,
            role: req.user!.role,
            input: parsed.data
        });

        return res.redirect(
            `/admin/conversations/${req.params.id}?success=message`
        );
    } catch {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=message`
        );
    }
}

    static async show(req: Request, res: Response) {
        try {
            const [conversation, agents, templates] = await Promise.all([
                ConversationService.getConversationForAdmin(
                    req.user!.workspaceId,
                    req.params.id
            ),
            UserService.listActiveAgents(req.user!.workspaceId),
            TemplateService.listApprovedTemplates(req.user!.workspaceId)
            ]);
            return res.render("pages/admin/conversations/show", {
                user: req.user,
                conversation,
                agents,
                templates,
                error: req.query.error || null,
                success: req.query.success || null
            });
        } catch {
            return res.redirect("/admin/conversations?error=not_found");
        }
    }

    // fala identar bien:

    static async sendTemplateMessage(req: Request, res: Response) {
    const parsed = sendTemplateMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=template`
        );
    }

    try {
        await MessageService.sendTemplateMessage({
            workspaceId: req.user!.workspaceId,
            conversationId: req.params.id,
            userId: req.user!.id,
            role: req.user!.role,
            input: parsed.data
        });

        return res.redirect(
            `/admin/conversations/${req.params.id}?success=template`
        );
    } catch {
        return res.redirect(
            `/admin/conversations/${req.params.id}?error=template`
        );
    }
}

    static async openFromContact(req: Request, res: Response) {
        try {
            const conversation =
                await ConversationService.createOrOpenConversationFromContact(
                    req.user!.workspaceId,
                    req.params.contactId
                );

            return res.redirect(`/admin/conversations/${conversation.id}`);
        } catch {
            return res.redirect("/admin/contacts?error=conversation");
        }
    }

    static async assign(req: Request, res: Response) {
        const parsed = assignConversationSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.redirect(
                `/admin/conversations/${req.params.id}?error=assign`
            );
        }

        try {
            await ConversationService.assignConversation(
                req.user!.workspaceId,
                req.params.id,
                parsed.data.agentId,
                req.user!.id
            );

            return res.redirect(
                `/admin/conversations/${req.params.id}?success=assigned`
            );
        } catch {
            return res.redirect(
                `/admin/conversations/${req.params.id}?error=assign`
            );
        }
    }

    static async close(req: Request, res: Response) {
        try {
            await ConversationService.closeConversation(
                req.user!.workspaceId,
                req.params.id,
                req.user!.id,
                "ADMIN"
            );

            return res.redirect(
                `/admin/conversations/${req.params.id}?success=closed`
            );
        } catch {
            return res.redirect(
                `/admin/conversations/${req.params.id}?error=close`
            );
        }
    }

    static async reopen(req: Request, res: Response) {
        try {
            await ConversationService.reopenConversation(
                req.user!.workspaceId,
                req.params.id
            );

            return res.redirect(
                `/admin/conversations/${req.params.id}?success=reopened`
            );
        } catch {
            return res.redirect(
                `/admin/conversations/${req.params.id}?error=reopen`
            );
        }
    }
}
