import { Router } from "express";

import { MetaWebhookController } from "../controllers/meta-webhook.controller";

const router = Router();

router.get("/meta/whatsapp", MetaWebhookController.verify);
router.post("/meta/whatsapp", MetaWebhookController.receive);

export default router;
