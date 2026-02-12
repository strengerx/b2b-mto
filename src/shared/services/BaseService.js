export class BaseService {
    constructor(model, options = {}) {
        this.model = model;

        this.searchFields = options.searchFields || [];
        this.defaultSort = options.defaultSort || '-createdAt';
        this.defaultLimit = options.defaultLimit || 10;
        this.maxLimit = options.maxLimit || 100;
        this.softDelete = options.softDelete ?? false;
        this.defaultFilter = options.defaultFilter || {};
    }

    buildFilter(query = {}) {
        const filter = { ...this.defaultFilter };

        // Soft delete: normalize includeDeleted which may come as string in req.query
        const includeDeleted = (() => {
            if (query == null) return false;
            const v = query.includeDeleted;
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') return ['1', 'true', 'yes'].includes(v.toLowerCase());
            return false;
        })();

        if (this.softDelete && !includeDeleted) {
            filter.deletedAt = null;
        }

        // Search (escape user input for regex to avoid injection/reDoS)
        if (query.search && this.searchFields.length) {
            const escaped = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = this.searchFields.map(field => ({
                [field]: { $regex: escaped, $options: 'i' }
            }));
        }

        return filter;
    }

    buildOptions(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.min(
            Number(query.limit) || this.defaultLimit,
            this.maxLimit
        );

        const skip = (page - 1) * limit;

        return {
            page,
            limit,
            skip,
            sort: query.sort || this.defaultSort
        };
    }

    async findAll(query = {}) {
        const filter = this.buildFilter(query);
        const { skip, limit, sort, page } = this.buildOptions(query);

        const [data, total] = await Promise.all([
            this.model.find(filter).sort(sort).skip(skip).limit(limit),
            this.model.countDocuments(filter)
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async findById(id, options = {}) {
        // When softDelete is enabled, default to excluding deleted documents
        const includeDeleted = options.includeDeleted === true;

        if (this.softDelete && !includeDeleted) {
            return this.model.findOne({ _id: id, deletedAt: null });
        }

        return this.model.findById(id);
    }

    async create(payload) {
        return this.model.create(payload);
    }

    async updateById(id, payload) {
        return this.model.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
    }

    // Safe update that loads the document and saves it back.
    // This ensures model pre-save hooks (e.g., password hashing) are executed.
    async updateByIdSafe(id, payload) {
        if (!payload || typeof payload !== 'object') return this.updateById(id, payload);

        const doc = await this.model.findById(id);
        if (!doc) return null;

        Object.assign(doc, payload);
        await doc.save();
        return doc;
    }

    async deleteById(id) {
        if (this.softDelete) {
            return this.model.findByIdAndUpdate(id, {
                deletedAt: new Date()
            }, { new: true });
        }
        return this.model.findByIdAndDelete(id);
    }

    // Restore a soft-deleted document (only when softDelete enabled)
    async restoreById(id) {
        if (!this.softDelete) return null;
        return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
    }
}
