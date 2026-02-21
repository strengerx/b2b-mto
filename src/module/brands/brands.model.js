import { createModel } from "../../shared/db/baseModel.js";
import { softDeletePlugin } from "../../shared/db/plugins/softDelete.plugin.js";

const brandsSchema = {
    // 🏷️ Basic Info
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },

    slug: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        index: true
    },

    description: {
        type: String,
        trim: true
    },

    website: String,
    country: String,
    foundedYear: Number,

    // 🏷️ Labels / Tags
    labels: {
        type: [String],
        default: []
    },

    // 🎨 Branding Assets
    logo: String,
    banner: String,
    icon: String,

    // 🌐 Social & External Links
    socialLinks: {
        facebook: String,
        instagram: String,
        twitter: String,
        linkedin: String,
        youtube: String
    },

    // 🎯 Display & UI Controls
    order: {
        type: Number,
        default: 0,
        index: true
    },

    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },

    showInHomepage: {
        type: Boolean,
        default: true,
        index: true
    },

    // 🔍 SEO
    seo: {
        title: String,
        description: String,
        keywords: {
            type: [String],
            default: []
        }
    },

    // 📊 Analytics / Metrics
    metrics: {
        productCount: {
            type: Number,
            default: 0,
            min: 0,
            index: true
        },

        popularityScore: {
            type: Number,
            default: 0,
            index: true
        },

        totalViews: {
            type: Number,
            default: 0,
            min: 0
        }
    },

    // ✅ Status Management
    status: {
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        isVerified: {
            type: Boolean,
            default: false,
            index: true
        }
    }
};

const Brand = createModel({
    name: "Brand",
    schemaDefinition: brandsSchema,
    plugins: [softDeletePlugin],
    setup(schema) {
        // Compound indexes for common queries
        schema.index({ country: 1, isFeatured: 1 });
        schema.index({ createdAt: -1 });
        schema.index({ "metrics.productCount": -1 });
        schema.index({ "metrics.popularityScore": -1 });

        // Text index for full-text search
        schema.index({ name: "text", description: "text", labels: "text" });
    }
});

export default Brand;