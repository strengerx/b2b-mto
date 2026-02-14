import mongoose from "mongoose";
import { baseSchema } from "../../shared/db/baseSchema.js";

const pricingTierSchema = new mongoose.Schema({
    minQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    maxQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, { _id: false });

const customizationOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["select", "text", "number"],
        required: true
    },
    choices: {
        type: [String],
        default: []
    },
    priceModifier: {
        type: Number,
        default: 0
    }
}, { _id: false });

const productImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    altText: String,
    isMain: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    // Basic Information
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    shortDescription: String,

    // Category & Classification
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    tags: {
        type: [String],
        default: [],
        index: true
    },

    // Pricing (B2B Volume-based)
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    pricingTiers: {
        type: [pricingTierSchema],
        default: []
    },
    currency: {
        type: String,
        default: "USD"
    },

    // B2B/MTO Specific
    minOrderQuantity: {
        type: Number,
        default: 1,
        min: 1
    },
    maxOrderQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    leadTimeDays: {
        type: Number,
        default: 0,
        min: 0
    },
    manufacturingCapacity: {
        type: Number,
        required: true,
        min: 1
    },

    // Inventory
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    isStockTracked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["active", "inactive", "discontinued", "draft"],
        default: "draft",
        index: true
    },

    // Media
    images: {
        type: [productImageSchema],
        default: []
    },

    // Customization Options
    customizationOptions: {
        type: [customizationOptionSchema],
        default: []
    },

    // Specifications
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Seller/Admin Info
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    // Metadata
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true
    },

    // SEO
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String]
}, {
    timestamps: true
});

// Add base schema fields (createdAt, updatedAt, deletedAt, etc.)
productSchema.add(baseSchema);

// Indexes for better query performance
productSchema.index({ name: "text", description: "text", tags: "text", sku: "text" });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ isPublished: 1, status: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ slug: 1 });

// Virtual for minimum tier price
productSchema.virtual("minTierPrice").get(function () {
    if (this.pricingTiers.length === 0) return this.basePrice;
    const prices = this.pricingTiers.map(t => t.price);
    return Math.min(...prices);
});

// Virtual for maximum tier price
productSchema.virtual("maxTierPrice").get(function () {
    if (this.pricingTiers.length === 0) return this.basePrice;
    const prices = this.pricingTiers.map(t => t.price);
    return Math.max(...prices);
});

// Virtual for main image
productSchema.virtual("mainImage").get(function () {
    return this.images.find(img => img.isMain) || this.images[0] || null;
});

// Middleware to ensure slug is lowercase
productSchema.pre("save", function (next) {
    if (this.isModified("slug")) {
        this.slug = this.slug.toLowerCase();
    }
    next();
});

// Middleware to update updatedBy timestamp
productSchema.pre(["findByIdAndUpdate", "updateOne", "updateMany"], function (next) {
    this.set({ updatedBy: this.getOptions().updatedBy });
    next();
});

export const Product = mongoose.model("Product", productSchema);
