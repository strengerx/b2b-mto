import { Product } from "./products.model.js";
import { BaseService } from "../../shared/services/BaseService.js";
import { AppError } from "../../shared/errors/AppError.js";

export class ProductService extends BaseService {
    constructor() {
        super(Product);
    }

    /**
     * Get price for a specific quantity based on pricing tiers
     * @param {Object} product - Product document
     * @param {number} quantity - Order quantity
     * @returns {number} Applicable price
     */
    getPriceForQuantity(product, quantity) {
        if (!product.pricingTiers || product.pricingTiers.length === 0) {
            return product.basePrice;
        }

        const tier = product.pricingTiers.find(
            t => quantity >= t.minQuantity && quantity <= t.maxQuantity
        );

        return tier ? tier.price : product.basePrice;
    }

    /**
     * Calculate estimated delivery date
     * @param {Object} product - Product document
     * @param {number} quantity - Order quantity
     * @returns {Date} Estimated delivery date
     */
    estimateDeliveryDate(product, quantity) {
        const daysNeeded = Math.ceil(quantity / product.manufacturingCapacity);
        const totalDays = product.leadTimeDays + daysNeeded;
        return new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
    }

    /**
     * Find all published products with filtering and pagination
     * @param {Object} query - Query filters
     * @param {Array} fields - Fields to select
     * @returns {Promise<{data, meta}>}
     */
    async findPublished(query, fields = null) {
        const {
            categoryId,
            minPrice,
            maxPrice,
            search,
            tags,
            page = 1,
            limit = 20,
            sort = "-createdAt"
        } = query;

        const filter = {
            isPublished: true,
            status: "active",
            deletedAt: null
        };

        if (categoryId) {
            filter.categoryId = categoryId;
        }

        if (search) {
            filter.$text = { $search: search };
        }

        if (tags) {
            const tagArray = tags.split(",").map(t => t.trim());
            filter.tags = { $in: tagArray };
        }

        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) filter.basePrice.$gte = minPrice;
            if (maxPrice) filter.basePrice.$lte = maxPrice;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Product.find(filter, fields)
                .limit(limit)
                .skip(skip)
                .sort(sort)
                .populate("categoryId", "name slug"),
            Product.countDocuments(filter)
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Find all products with admin filters
     * @param {Object} query - Query filters
     * @param {Array} fields - Fields to select
     * @returns {Promise<{data, meta}>}
     */
    async findAll(query, fields = null) {
        const {
            categoryId,
            status,
            minPrice,
            maxPrice,
            search,
            createdBy,
            page = 1,
            limit = 20,
            sort = "-createdAt"
        } = query;

        const filter = { deletedAt: null };

        if (categoryId) filter.categoryId = categoryId;
        if (status) filter.status = status;
        if (createdBy) filter.createdBy = createdBy;

        if (search) {
            filter.$text = { $search: search };
        }

        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) filter.basePrice.$gte = minPrice;
            if (maxPrice) filter.basePrice.$lte = maxPrice;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Product.find(filter, fields)
                .limit(limit)
                .skip(skip)
                .sort(sort)
                .populate("categoryId", "name slug")
                .populate("createdBy", "name email"),
            Product.countDocuments(filter)
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Create a new product
     * @param {Object} data - Product data
     * @param {string} userId - User ID creating the product
     * @returns {Promise<Object>} Created product
     */
    async create(data, userId) {
        // Check if SKU already exists
        const existingBySku = await Product.findOne({ sku: data.sku });
        if (existingBySku) {
            throw new AppError("SKU already exists", 400);
        }

        // Check if slug already exists
        const existingBySlug = await Product.findOne({ slug: data.slug });
        if (existingBySlug) {
            throw new AppError("Slug already exists", 400);
        }

        const product = await Product.create({
            ...data,
            createdBy: userId
        });

        return product;
    }

    /**
     * Update product by ID
     * @param {string} id - Product ID
     * @param {Object} data - Update data
     * @param {string} userId - User ID updating the product
     * @returns {Promise<Object|null>} Updated product or null if not found
     */
    async updateById(id, data, userId) {
        // Check if updating SKU and if new SKU exists
        if (data.sku) {
            const existing = await Product.findOne({
                sku: data.sku,
                _id: { $ne: id }
            });
            if (existing) {
                throw new AppError("SKU already exists", 400);
            }
        }

        // Check if updating slug and if new slug exists
        if (data.slug) {
            const existing = await Product.findOne({
                slug: data.slug,
                _id: { $ne: id }
            });
            if (existing) {
                throw new AppError("Slug already exists", 400);
            }
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { ...data, updatedBy: userId },
            { new: true, runValidators: true }
        );

        return product;
    }

    /**
     * Add image to product
     * @param {string} productId - Product ID
     * @param {Object} imageData - Image data {url, altText, isMain}
     * @returns {Promise<Object>} Updated product
     */
    async addImage(productId, imageData) {
        // If marking as main, unmark other images
        if (imageData.isMain) {
            await Product.findByIdAndUpdate(
                productId,
                { $set: { "images.$[].isMain": false } }
            );
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            { $push: { images: { ...imageData, uploadedAt: new Date() } } },
            { new: true }
        );

        return product;
    }

    /**
     * Remove image from product
     * @param {string} productId - Product ID
     * @param {number} imageIndex - Image index in array
     * @returns {Promise<Object>} Updated product
     */
    async removeImage(productId, imageIndex) {
        const product = await Product.findById(productId);
        if (!product) return null;

        if (imageIndex < 0 || imageIndex >= product.images.length) {
            throw new AppError("Image index out of range", 400);
        }

        product.images.splice(imageIndex, 1);
        await product.save();
        return product;
    }

    /**
     * Validate quantity against min/max
     * @param {Object} product - Product document
     * @param {number} quantity - Quantity to validate
     * @throws {AppError} If quantity is invalid
     */
    validateQuantity(product, quantity) {
        if (quantity < product.minOrderQuantity) {
            throw new AppError(
                `Minimum order quantity is ${product.minOrderQuantity}`,
                400
            );
        }

        if (quantity > product.maxOrderQuantity) {
            throw new AppError(
                `Maximum order quantity is ${product.maxOrderQuantity}`,
                400
            );
        }
    }

    /**
     * Check stock availability
     * @param {Object} product - Product document
     * @param {number} quantity - Quantity needed
     * @throws {AppError} If insufficient stock
     */
    checkStock(product, quantity) {
        if (!product.isStockTracked) return;

        if (product.stock < quantity) {
            throw new AppError(
                `Insufficient stock. Available: ${product.stock}`,
                400
            );
        }
    }

    /**
     * Deduct stock after order placed
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to deduct
     * @returns {Promise<Object>}
     */
    async deductStock(productId, quantity) {
        const product = await Product.findByIdAndUpdate(
            productId,
            { $inc: { stock: -quantity } },
            { new: true }
        );

        return product;
    }

    /**
     * Restore stock after order cancellation
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to restore
     * @returns {Promise<Object>}
     */
    async restoreStock(productId, quantity) {
        const product = await Product.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantity } },
            { new: true }
        );

        return product;
    }

    /**
     * Get low stock products alert
     * @param {number} threshold - Stock threshold percentage (default 20)
     * @returns {Promise<Array>}
     */
    async getLowStockProducts(threshold = 20) {
        const products = await Product.find({
            isStockTracked: true,
            status: "active",
            deletedAt: null
        }).select("sku name stock maxOrderQuantity");

        return products.filter(p => {
            const usagePercent = (p.stock / (p.stock + p.maxOrderQuantity)) * 100;
            return usagePercent < threshold;
        });
    }

    /**
     * Publish/unpublish product
     * @param {string} productId - Product ID
     * @param {boolean} isPublished - Publish status
     * @returns {Promise<Object>}
     */
    async setPublishStatus(productId, isPublished) {
        const product = await Product.findByIdAndUpdate(
            productId,
            {
                isPublished,
                status: isPublished ? "active" : "inactive"
            },
            { new: true }
        );

        return product;
    }

    /**
     * Search products by text
     * @param {string} searchTerm - Search query
     * @param {number} limit - Results limit
     * @returns {Promise<Array>}
     */
    async search(searchTerm, limit = 20) {
        const results = await Product.find(
            { $text: { $search: searchTerm }, isPublished: true },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .limit(limit)
            .select("sku name slug basePrice images");

        return results;
    }

    /**
     * Get products by category
     * @param {string} categoryId - Category ID
     * @param {Object} options - Query options
     * @returns {Promise<{data, meta}>}
     */
    async getByCategory(categoryId, options = {}) {
        const { page = 1, limit = 20, sort = "-createdAt" } = options;

        const filter = {
            categoryId,
            isPublished: true,
            status: "active",
            deletedAt: null
        };

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Product.find(filter)
                .limit(limit)
                .skip(skip)
                .sort(sort)
                .populate("categoryId", "name slug"),
            Product.countDocuments(filter)
        ]);

        return {
            data,
            meta: { page, limit, total, pages: Math.ceil(total / limit) }
        };
    }
}

export const productService = new ProductService();
