import { z } from "zod";

export const pricingTierSchema = z.object({
    minQuantity: z.number().int().positive("Minimum quantity must be positive"),
    maxQuantity: z.number().int().positive("Maximum quantity must be positive"),
    price: z.number().positive("Price must be positive"),
    discount: z.number().min(0).max(100).optional()
});

export const customizationOptionSchema = z.object({
    name: z.string().min(2).max(100),
    type: z.enum(["select", "text", "number"]),
    choices: z.array(z.string()).optional(),
    priceModifier: z.number().default(0)
});

export const specificationSchema = z.record(z.string());

export const productImageSchema = z.object({
    url: z.string().url("Invalid image URL"),
    altText: z.string().max(500).optional(),
    isMain: z.boolean().optional()
});

export const createProductSchema = z.object({
    sku: z.string().min(1).max(50),
    name: z.string().min(3).max(200),
    slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens and numbers only"),
    description: z.string().min(10),
    shortDescription: z.string().max(500),

    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),

    basePrice: z.number().positive("Base price must be positive"),
    pricingTiers: z.array(pricingTierSchema).optional(),
    currency: z.string().default("USD"),

    minOrderQuantity: z.number().int().positive(),
    maxOrderQuantity: z.number().int().positive(),
    leadTimeDays: z.number().int().min(0).default(0),
    manufacturingCapacity: z.number().positive(),

    stock: z.number().int().min(0).optional(),
    isStockTracked: z.boolean().default(false),
    status: z.enum(["active", "inactive", "discontinued", "draft"]).default("draft"),

    specifications: specificationSchema.optional(),
    customizationOptions: z.array(customizationOptionSchema).optional(),

    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    seoKeywords: z.array(z.string()).optional(),

    isPublished: z.boolean().default(false)
}).refine(
    (data) => data.minOrderQuantity <= data.maxOrderQuantity,
    {
        message: "Min order quantity must be less than or equal to max order quantity",
        path: ["minOrderQuantity"]
    }
);

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
    categoryId: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    search: z.string().optional(),
    status: z.enum(["active", "inactive", "discontinued", "draft"]).optional(),
    inStock: z.boolean().optional(),
    tags: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort: z.string().default("-createdAt")
});
