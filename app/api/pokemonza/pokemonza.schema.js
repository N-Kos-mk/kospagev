import { z } from "zod";

// DonutRecipeSchema
const StatusKeys = ["sweet", "spicy", "sour", "bitter", "fresh"];
const BerriesSchema = z.record(
    z.string().regex(/^\d+$/),
    z.number().int()
);
const StatusCapSchema = z.object({
    sweet: z.number().int().min(0).max(760).optional(),
    spicy: z.number().int().min(0).max(760).optional(),
    sour: z.number().int().min(0).max(760).optional(),
    bitter: z.number().int().min(0).max(760).optional(),
    fresh: z.number().int().min(0).max(760).optional(),
}).strict();
const LimitsSchema = z.object({
    count: z.number().int().min(1).max(8).optional(),
    berries: BerriesSchema.optional(),
    status_cap: StatusCapSchema.optional(),
}).strict();
const DonutRecipeSchema = z.object({
    flavor_rank: z.number().int().min(0).max(1200).optional(),
    sweet: z.number().int().min(0).max(760).optional(),
    spicy: z.number().int().min(0).max(760).optional(),
    sour: z.number().int().min(0).max(760).optional(),
    bitter: z.number().int().min(0).max(760).optional(),
    fresh: z.number().int().min(0).max(760).optional(),
    limits: LimitsSchema.optional(),
})
    .strict().refine(
        (obj) => Object.keys(obj).length > 0,
        { message: "少なくとも1つは値を指定してください" }
    ).superRefine((data, ctx) => {
        const caps = data.limits?.status_cap;
        if (!caps) return;
        for (const key of StatusKeys) {
            const base = data[key];
            const cap = caps[key];
            if (base !== undefined && cap !== undefined && cap < base) {
                ctx.addIssue({
                    path: ["limits", "status_cap", key],
                    message: `${key} の status_cap は [${base}] 以上である必要があります`,
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });




export const pokemonzaSchemas = {
    DONUT_RECIPE: DonutRecipeSchema,
};