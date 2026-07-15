import { Router } from "express";

import { AdminCampaignsController } from "../controllers/admin-campaigns.controller";

const router = Router();

router.get("/", AdminCampaignsController.index);
router.get("/create", AdminCampaignsController.create);
router.post("/", AdminCampaignsController.store);
router.get("/:id", AdminCampaignsController.show);

export default router;