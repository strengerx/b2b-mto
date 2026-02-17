import { z } from "zod";
import {
    MIN_CATEGORY_NAME_LENGTH,
    MAX_CATEGORY_NAME_LENGTH
} from "./categories.constants.js";

/* --------------------------------------------------
   Reusable ObjectId validator
--------------------------------------------------- */
const objectId = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

/* --------------------------------------------------
   Base Category Body (Sync validation only)
   Note: Async parent validation happens in service layer
--------------------------------------------------- */
const categoryBodyBase = z.object({
    // 🏷️ Basic Info
    name: z
        .string()
        .min(
            MIN_CATEGORY_NAME_LENGTH,
            `Name must be at least ${MIN_CATEGORY_NAME_LENGTH} characters`
        )
        .max(
            MAX_CATEGORY_NAME_LENGTH,
            `Name must not exceed ${MAX_CATEGORY_NAME_LENGTH} characters`
        )
        .trim(),

    slug: z
        .string()
        .min(2)
        .max(150)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and hyphenated")
        .trim(),

    description: z.string().max(1000).trim().optional(),

    // 🏷️ Labels
    labels: z.array(z.string().min(1).max(100).trim()).optional(),
    level: z.number().optional(),
    metrics: z.object({
        productCount: z.number().nullable()
    }).optional(),
    ancestors: z.array(objectId.nullable().optional()).optional(),

    // 🌳 Tree Structure
    parentId: objectId.nullable().optional(),

    // 🎨 UI & Display
    icon: z.string().max(200).optional(),
    image: z.string().max(500).optional(),
    order: z.number().int().min(0).optional(),

    isFeatured: z.boolean().optional(),
    showInMenu: z.boolean().optional(),

    // 🔍 SEO
    seo: z
        .object({
            title: z.string().max(150).optional(),
            description: z.string().max(300).optional(),
            keywords: z.array(z.string().min(1)).optional()
        })
        .optional(),

    // ✅ Status
    status: z
        .object({
            isActive: z.boolean().optional()
        })
        .optional()
}).strict();

/* --------------------------------------------------
   Create Category Schema (for POST /categories)
   Note: Async validation (parent exists, no circular refs)
         happens in service.create() and service.updateById()
--------------------------------------------------- */
export const categorySchema = {
    body: categoryBodyBase
};

/* --------------------------------------------------
   Update Category Schema (for PATCH /categories/:id)
   Note: All updates validated in service layer
         to support async checks and ancestor rebuilding
--------------------------------------------------- */
export const updateCategorySchema = {
    body: categoryBodyBase.partial()
};