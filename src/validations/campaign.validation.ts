import { z } from "zod";

export const createCampaignSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "El nombre de campaña es obligatorio.")
        .max(120, "El nombre es demasiado largo."),
    templateId: z
        .string()
        .trim()
        .min(1, "Selecciona una plantilla."),
    contactIds: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((value) => {
            if (!value) return [];

            if (Array.isArray(value)) {
                return value.filter((item) => item.trim() !== "");
            }

            return value.trim() !== "" ? [value] : [];
        })
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;