import { Request, Response } from "express";

import { WebhookService } from "../services/webhook.service";
import { MetaWebhookHandlerService } from "../services/meta-webhook-handler.service";
import { MetaWebhookPayload } from "../types/meta-webhook";

export class MetaWebhookController {
    static async verify(req: Request, res: Response) {
        try {
            const challenge = await WebhookService.verifyMetaWebhook({
                mode:
                    typeof req.query["hub.mode"] === "string"
                        ? req.query["hub.mode"]
                        : undefined,
                token:
                    typeof req.query["hub.verify_token"] === "string"
                        ? req.query["hub.verify_token"]
                        : undefined,
                challenge:
                    typeof req.query["hub.challenge"] === "string"
                        ? req.query["hub.challenge"]
                        : undefined
            });

            return res.status(200).send(challenge);
        } catch {
            return res.sendStatus(403);
        }
    }

    static async receive(req: Request, res: Response) {
        try {
            await MetaWebhookHandlerService.handleIncomingPayload(
                req.body as MetaWebhookPayload
            );

            return res.sendStatus(200);
        } catch (error) {
            console.error("Error procesando webhook:", error);

            /**
             * Importante:
             * A Meta le respondemos 200 para evitar reintentos infinitos
             * durante desarrollo. El error queda en consola/logs.
             */
            return res.sendStatus(200);
        }
    }
}
