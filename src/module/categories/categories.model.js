import { createModel } from "../../shared/db/baseModel.js";
import { softDeletePlugin } from "../../shared/db/plugins/softDelete.plugin.js";
import { Schema } from "mongoose";
import { MAX_CATEGORY_DEPTH } from "./categories.constants.js";

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
        index: true,
        validate: {
            validator: async function (value) {
                if (!value) return true;
                if (this._id && value.equals(this._id)) return false; // Prevent self-reference
                const parent = await this.constructor.findOne({ _id: value, deletedAt: null });
                return !!parent;
            },
            message: "Parent category does not exist or has been deleted"
        }
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
        min: 0,
        max: MAX_CATEGORY_DEPTH,
        index: true
    },

    // 🎨 UI & Display
    icon: String,
    image: String,
    order: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false, index: true },
    showInMenu: { type: Boolean, default: true, index: true },

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
        productCount: { type: Number, default: 0, min: 0 }
    },

    // ✅ Status
    status: {
        isActive: { type: Boolean, default: true, index: true }
    }
};

const Category = createModel({
    name: "Category",
    schemaDefinition: categorySchema,
    plugins: [softDeletePlugin],
    setup(schema) {
        // Compound indexes for tree queries
        schema.index({ parentId: 1, order: 1 });
        schema.index({ name: 1, parentId: 1 }, { unique: true });

        /* --------------------------------------------------
           Validate depth on save
        --------------------------------------------------- */
        schema.pre("save", async function () {
            if (this.parentId && this.isModified("parentId")) {
                const parent = await schema
                    .model("Category")
                    .findById(this.parentId);

                if (parent && parent.level >= MAX_CATEGORY_DEPTH) {
                    throw new Error(
                        `Cannot nest deeper than level ${MAX_CATEGORY_DEPTH}. Parent is at level ${parent.level}`
                    );
                }

                this.level = parent ? parent.level + 1 : 0;
            }
        });

        /* --------------------------------------------------
           Prevent circular reference on update
        --------------------------------------------------- */
        schema.pre("findByIdAndUpdate", async function () {
            const update = this.getUpdate();
            const categoryId = this.getFilter()._id;

            const newParentId =
                update?.$set?.parentId ?? update?.parentId;

            if (!newParentId) return;

            // Prevent self-parent
            if (
                newParentId === categoryId.toString() ||
                newParentId?.equals?.(categoryId)
            ) {
                throw new Error("Category cannot be its own parent");
            }

            // Check if new parent is a descendant
            const descendants = await schema
                .model("Category")
                .find({
                    "ancestors._id": categoryId
                });

            const isDescendant = descendants.some(d =>
                d._id.equals(newParentId)
            );

            if (isDescendant) {
                throw new Error(
                    "Cannot set a descendant as parent (circular reference)"
                );
            }
        });
    }
});

export default Category;
