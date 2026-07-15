import { Request, Response } from "express";

import { appConfig } from "../config/app.config";

export class HomeController {
    static index(req: Request, res: Response) {
        return res.render("pages/home/index", {
            appName: appConfig.name,
            version: "1.0.0"
        });
    }
}
