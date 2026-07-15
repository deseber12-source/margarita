import { Request, Response } from "express";

import { CampaignService } from "../services/campaign.service";
import { getRequiredParam } from "../utils/request";
import { createCampaignSchema } from "../validations/campaign.validation";

export class AdminCampaignsController {
    static async index(req: Request, res: Response) {
        const campaigns = await CampaignService.listCampaigns(
            req.user!.workspaceId
        );

        return res.render("pages/admin/campaigns/index", {
            user: req.user,
            campaigns,
            success: req.query.success || null,
            error: req.query.error || null
        });
    }

    static async create(req: Request, res: Response) {
        const data = await CampaignService.getCreateData(
            req.user!.workspaceId
        );

        return res.render("pages/admin/campaigns/create", {
            user: req.user,
            templates: data.templates,
            contacts: data.contacts,
            error: req.query.error || null
        });
    }

    static async store(req: Request, res: Response) {
        const parsed = createCampaignSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.redirect("/admin/campaigns/create?error=validation");
        }

        try {
            const campaign = await CampaignService.createCampaign(
                req.user!.workspaceId,
                req.user!.id,
                parsed.data
            );

            return res.redirect(
                `/admin/campaigns/${campaign.id}?success=created`
            );
        } catch {
            return res.redirect("/admin/campaigns/create?error=create");
        }
    }

    static async show(req: Request, res: Response) {
        const campaignId = getRequiredParam(req, "id");

        const campaign = await CampaignService.getCampaign(
            req.user!.workspaceId,
            campaignId
        );

        if (!campaign) {
            return res.redirect("/admin/campaigns?error=not_found");
        }

        return res.render("pages/admin/campaigns/show", {
            user: req.user,
            campaign,
            success: req.query.success || null,
            error: req.query.error || null
        });
    }
}