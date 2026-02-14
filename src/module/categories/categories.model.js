import { createModel } from "../../shared/db/baseModel.js";
import { softDeletePlugin } from "../../shared/db/plugins/softDelete.plugin.js";
import { Schema } from "mongoose";

const categorySchema = {
    // 🏷️ Basic Info
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, index: true, lowercase: true },
    description: { type: String, trim: true },

    // 🏷️ Simple Labels / Tags
    labels: {
        type: [String],
        default: []
    },

    // 🌳 Tree Structure
    parentId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null,
        index: true
    },

    ancestors: [
        {
            _id: { type: Schema.Types.ObjectId, ref: "Category" },
            slug: String,
            name: String
        }
    ],

    level: {
        type: Number,
        default: 0,
        min: 0
    },

    // 🎨 UI & Display
    icon: String,
    image: String,
    order: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    showInMenu: { type: Boolean, default: true },

    // 🔍 SEO
    seo: {
        title: String,
        description: String,
        keywords: {
            type: [String],
            default: []
        }
    },

    // 📊 Analytics
    metrics: {
        productCount: { type: Number, default: 0 }
    },

    // ✅ Status
    status: {
        isActive: { type: Boolean, default: true }
        // isDeleted removed because softDeletePlugin handles it
    }
};

const Category = createModel({
    name: "Category",
    schemaDefinition: categorySchema,
    plugins: [softDeletePlugin],
    setup(schema) {
        // Helpful compound index for tree queries
        schema.index({ parentId: 1, order: 1 });

        // Optional: prevent duplicate name under same parent
        schema.index({ name: 1, parentId: 1 }, { unique: true });
    }
});

export default Category;
