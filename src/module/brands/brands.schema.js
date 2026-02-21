import { z } from "zod";
import {
    BRAND_CONSTRAINTS,
} from "./brands.constants.js";

// Reusable URL validator (flexible)
const urlValidator = z.string().url().or(z.string().max(255)).optional();

// Social links schema
const socialLinksSchema = z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    youtube: z.string().url().optional()
}).optional();

// SEO schema
const seoSchema = z.object({
    title: z.string().max(150).optional(),
    description: z.string().max(300).optional(),
    keywords: z.array(z.string().min(1)).max(10).optional()
}).optional();

// Status schema  
const statusSchema = z.object({
    isActive: z.boolean().default(true),
    isVerified: z.boolean().default(false)
}).optional();

/**
 * Create Brand Schema
 * Validation for POST /brands endpoint
 */
export const createBrandSchema = {
    body: z.object({
        // Required fields
        name: z
            .string()
            .min(
                BRAND_CONSTRAINTS.MIN_NAME_LENGTH,
                `Name must be at least ${BRAND_CONSTRAINTS.MIN_NAME_LENGTH} characters`
            )
            .max(
                BRAND_CONSTRAINTS.MAX_NAME_LENGTH,
                `Name must not exceed ${BRAND_CONSTRAINTS.MAX_NAME_LENGTH} characters`
            )
            .trim(),

        slug: z
            .string()
            .min(2)
            .max(150)
            .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens and numbers")
            .trim(),

        // Optional fields
        description: z
            .string()
            .min(
                BRAND_CONSTRAINTS.MIN_DESCRIPTION_LENGTH,
                `Description must be at least ${BRAND_CONSTRAINTS.MIN_DESCRIPTION_LENGTH} characters`
            )
            .max(
                BRAND_CONSTRAINTS.MAX_DESCRIPTION_LENGTH,
                `Description must not exceed ${BRAND_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} characters`
            )
            .trim()
            .optional(),

        website: urlValidator,

        country: z
            .string()
            .min(2)
            .max(3)
            .optional(),

        foundedYear: z
            .number()
            .int()
            .min(BRAND_CONSTRAINTS.MIN_FOUNDED_YEAR, `Founded year cannot be before ${BRAND_CONSTRAINTS.MIN_FOUNDED_YEAR}`)
            .max(BRAND_CONSTRAINTS.MAX_FOUNDED_YEAR, `Founded year cannot be after ${BRAND_CONSTRAINTS.MAX_FOUNDED_YEAR}`)
            .optional(),

        // Branding Assets
        logo: z.string().url().or(z.string().max(500)).optional(),
        banner: z.string().url().or(z.string().max(500)).optional(),
        icon: z.string().url().or(z.string().max(500)).optional(),

        // Labels/Tags
        labels: z
            .array(z.string().min(1).max(50).trim())
            .max(BRAND_CONSTRAINTS.MAX_LABELS, `Maximum ${BRAND_CONSTRAINTS.MAX_LABELS} labels allowed`)
            .optional(),

        // Social & External Links
        socialLinks: socialLinksSchema,

        // Display Controls
        order: z.number().int().min(0).optional(),
        isFeatured: z.boolean().optional(),
        showInHomepage: z.boolean().optional(),

        // SEO
        seo: seoSchema,

        // Status (admin only in create)
        status: statusSchema
    }).strict()
};

/**
 * Update Brand Schema
 * Validation for PATCH /brands/:id endpoint
 */
export const updateBrandSchema = {
    body: z.object({
        name: z
            .string()
            .min(BRAND_CONSTRAINTS.MIN_NAME_LENGTH)
            .max(BRAND_CONSTRAINTS.MAX_NAME_LENGTH)
            .trim()
            .optional(),

        slug: z
            .string()
            .min(2)
            .max(150)
            .regex(/^[a-z0-9-]+$/)
            .trim()
            .optional(),

        description: z
            .string()
            .min(BRAND_CONSTRAINTS.MIN_DESCRIPTION_LENGTH)
            .max(BRAND_CONSTRAINTS.MAX_DESCRIPTION_LENGTH)
            .trim()
            .optional(),

        website: urlValidator,
        country: z.string().min(2).max(3).optional(),

        foundedYear: z
            .number()
            .int()
            .min(BRAND_CONSTRAINTS.MIN_FOUNDED_YEAR)
            .max(BRAND_CONSTRAINTS.MAX_FOUNDED_YEAR)
            .optional(),

        logo: z.string().url().or(z.string().max(500)).optional(),
        banner: z.string().url().or(z.string().max(500)).optional(),
        icon: z.string().url().or(z.string().max(500)).optional(),

        labels: z
            .array(z.string().min(1).max(50).trim())
            .max(BRAND_CONSTRAINTS.MAX_LABELS)
            .optional(),

        socialLinks: socialLinksSchema,

        order: z.number().int().min(0).optional(),
        isFeatured: z.boolean().optional(),
        showInHomepage: z.boolean().optional(),

        seo: seoSchema,
        status: statusSchema
    }).partial().strict()
};

/**
 * Brand Filter & Search Schema
 * Validation for query parameters
 */
export const brandFilterSchema = {
    query: z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        isFeatured: z.enum(["true", "false"]).optional(),
        isVerified: z.enum(["true", "false"]).optional(),
        showInHomepage: z.enum(["true", "false"]).optional(),
        sortBy: z.string().optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20)
    }).strict()
};
