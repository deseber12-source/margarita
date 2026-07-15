import { Request, Response } from "express";


import { sendFreeTextMessageSchema } from "../validations/free-text-message.validation";
import { TemplateService } from "../services/template.service";
import { sendTemplateMessageSchema } from "../validations/template-message.validation";
import { MessageService } from "../services/message.service";
import { sendLocalMessageSchema } from "../validations/message.validation";
import { ConversationService } from "../services/conversation.service";

export class AgentConversationsController {
    static async index(req: Request, res: Response) {
        const conversations = await ConversationService.listConversations({
            workspaceId: req.user!.workspaceId,
            userId: req.user!.id,
            role: "AGENT",
            status: "OPEN"
        });

        return res.render("pages/agent/conversations/index", {
            user: req.user,
            conversations,
            success: req.query.success || null,
            error: req.query.error || null
        });
    }

    static async sendFreeTextMessage(req: Request, res: Response) {
    const parsed = sendFreeTextMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=free_text`
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
            `/agent/conversations/${req.params.id}?success=free_text`
        );
    } catch {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=free_text`
        );
    }
}

    static async sendLocalMessage(req: Request, res: Response) {
    const parsed = sendLocalMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=message`
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
            `/agent/conversations/${req.params.id}?success=message`
        );
    } catch {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=message`
        );
    }
}
    
    static async show(req: Request, res: Response) {
        try {
            // falta identar bien
            const [conversation, templates] = await Promise.all([
    ConversationService.getConversationForAgent(
        req.user!.workspaceId,
        req.user!.id,
        req.params.id
    ),
    TemplateService.listApprovedTemplates(req.user!.workspaceId)
]);

return res.render("pages/agent/conversations/show", {
    user: req.user,
    conversation,
    templates,
    success: req.query.success || null,
    error: req.query.error || null
});
        } catch {
            return res.redirect("/agent/conversations?error=not_found");
        }
    }

    // falta identar bien
    static async sendTemplateMessage(req: Request, res: Response) {
    const parsed = sendTemplateMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=template`
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
            `/agent/conversations/${req.params.id}?success=template`
        );
    } catch {
        return res.redirect(
            `/agent/conversations/${req.params.id}?error=template`
        );
    }
}

    static async close(req: Request, res: Response) {
        try {
            await ConversationService.closeConversation(
                req.user!.workspaceId,
                req.params.id,
                req.user!.id,
                "AGENT"
            );

            return res.redirect("/agent/conversations?success=closed");
        } catch {
            return res.redirect(
                `/agent/conversations/${req.params.id}?error=close`
            );
        }
    }
}
