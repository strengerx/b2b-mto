import catchAsync from "../../shared/utils/catchAsync.js";
import { created, success } from "../../shared/responses/apiResponse.js";
import { productService } from "./products.service.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * GET /products - Get all published products (public)
 */
export const index = catchAsync(async (req, res) => {
    const result = await productService.findPublished(req.query);
    return success(res, result.data, "Products retrieved", 200, result.meta);
});

/**
 * GET /products/search - Search products (public)
 */
export const search = catchAsync(async (req, res) => {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        return success(res, [], "No search query provided");
    }

    const results = await productService.search(q, parseInt(limit));
    return success(res, results, "Search results");
});

/**
 * GET /products/:id - Get single product details (public)
 */
export const show = catchAsync(async (req, res) => {
    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    // Check if published for public access, or if requester is owner/admin
    const isPublished = product.isPublished && product.status === "active";
    const isOwnerOrAdmin = req.user &&
        (req.user.id === product.createdBy.toString() || req.user.role === "ADMIN");

    if (!isPublished && !isOwnerOrAdmin) {
        return success(res, null, "Product not found", 404);
    }

    return success(res, product, "Product retrieved");
});

/**
 * POST /products - Create new product (admin only)
 */
export const store = catchAsync(async (req, res) => {
    const newProduct = await productService.create(req.body, req.user.id);

    const productData = pickFields(newProduct.toObject(), [
        "_id",
        "sku",
        "name",
        "slug",
        "basePrice",
        "status",
        "isPublished"
    ]);

    return created(res, productData, "Product created successfully");
});

/**
 * PATCH /products/:id - Update product (admin only)
 */
export const update = catchAsync(async (req, res) => {
    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    // Verify ownership or admin role
    if (req.user.id !== product.createdBy.toString() && req.user.role !== "ADMIN") {
        return success(res, null, "Unauthorized to update this product", 403);
    }

    const updated = await productService.updateById(
        req.params.id,
        req.body,
        req.user.id
    );

    const productData = pickFields(updated.toObject(), [
        "_id",
        "sku",
        "name",
        "slug",
        "description",
        "basePrice",
        "pricingTiers",
        "status",
        "isPublished",
        "updatedAt"
    ]);

    return success(res, productData, "Product updated successfully");
});

/**
 * DELETE /products/:id - Soft delete product (admin only)
 */
export const destroy = catchAsync(async (req, res) => {
    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    // Verify ownership or admin role
    if (req.user.id !== product.createdBy.toString() && req.user.role !== "ADMIN") {
        return success(res, null, "Unauthorized to delete this product", 403);
    }

    await productService.deleteById(req.params.id);
    return success(res, null, "Product deleted successfully");
});

/**
 * POST /products/:id/restore - Restore soft-deleted product (admin only)
 */
export const restore = catchAsync(async (req, res) => {
    const restored = await productService.restoreById(req.params.id);

    if (!restored) {
        return success(res, null, "Product not found or not deleted", 404);
    }

    return success(res, pickFields(restored.toObject(), ["_id", "name", "sku"]), "Product restored");
});

/**
 * POST /products/:id/publish - Publish product (admin only)
 */
export const publish = catchAsync(async (req, res) => {
    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    if (product.status === "draft") {
        return success(res, null, "Cannot publish draft product. Set status to active first", 400);
    }

    const updated = await productService.setPublishStatus(req.params.id, true);
    return success(res, pickFields(updated.toObject(), ["_id", "isPublished", "status"]), "Product published");
});

/**
 * POST /products/:id/unpublish - Unpublish product (admin only)
 */
export const unpublish = catchAsync(async (req, res) => {
    const updated = await productService.setPublishStatus(req.params.id, false);

    if (!updated) {
        return success(res, null, "Product not found", 404);
    }

    return success(res, pickFields(updated.toObject(), ["_id", "isPublished", "status"]), "Product unpublished");
});

/**
 * POST /products/:id/media - Add image to product (admin only)
 */
export const addMedia = catchAsync(async (req, res) => {
    const { url, altText, isMain } = req.body;

    if (!url) {
        throw new AppError("Image URL is required", 400);
    }

    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    const updated = await productService.addImage(req.params.id, {
        url,
        altText: altText || "",
        isMain: isMain || false
    });

    return success(res, pickFields(updated.toObject(), ["_id", "images"]), "Image added successfully");
});

/**
 * DELETE /products/:id/media/:imageIndex - Remove image from product (admin only)
 */
export const removeMedia = catchAsync(async (req, res) => {
    const { imageIndex } = req.params;

    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    const updated = await productService.removeImage(req.params.id, parseInt(imageIndex));

    if (!updated) {
        return success(res, null, "Image not found", 404);
    }

    return success(res, pickFields(updated.toObject(), ["_id", "images"]), "Image removed successfully");
});

/**
 * GET /products/category/:categoryId - Get products by category (public)
 */
export const getByCategory = catchAsync(async (req, res) => {
    const result = await productService.getByCategory(req.params.categoryId, req.query);

    if (result.data.length === 0) {
        return success(res, [], "No products found in this category");
    }

    return success(res, result.data, "Products retrieved", 200, result.meta);
});

/**
 * GET /products/admin/stock-alerts - Get low stock products (admin only)
 */
export const getLowStockAlerts = catchAsync(async (req, res) => {
    const { threshold = 20 } = req.query;
    const products = await productService.getLowStockProducts(parseInt(threshold));

    return success(res, products, "Low stock products", 200, { count: products.length });
});

/**
 * GET /products/:id/price-for-quantity/:quantity - Calculate price for quantity (public)
 */
export const getPriceForQuantity = catchAsync(async (req, res) => {
    const { quantity } = req.params;

    const product = await productService.findById(req.params.id);

    if (!product) {
        return success(res, null, "Product not found", 404);
    }

    try {
        productService.validateQuantity(product, parseInt(quantity));
    } catch (err) {
        return success(res, null, err.message, 400);
    }

    const price = productService.getPriceForQuantity(product, parseInt(quantity));
    const deliveryDate = productService.estimateDeliveryDate(product, parseInt(quantity));

    return success(res, {
        quantity: parseInt(quantity),
        price,
        currency: product.currency,
        leadTimeDays: product.leadTimeDays,
        estimatedDeliveryDate: deliveryDate,
        discount: null
    }, "Price calculated successfully");
});
