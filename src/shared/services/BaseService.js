export class BaseService {
    constructor(model, options = {}) {
        this.model = model;

        this.searchFields = options.searchFields || [];
        this.defaultSort = options.defaultSort || "-createdAt";
        this.defaultLimit = options.defaultLimit || 10;
        this.maxLimit = options.maxLimit || 100;
        this.softDelete = options.softDelete ?? false;
        this.defaultFilter = options.defaultFilter || {};
    }

    /* ============================================================
          RESPONSE HELPERS ✅
      ============================================================ */

    success(data, meta = null) {
        return { success: true, data, ...(meta && { meta }), };
    }

    /* ============================================================
          SAFETY HELPERS
      ============================================================ */

    isPlainObject(obj) {
        return obj && typeof obj === "object" && obj.constructor === Object;
    }

    sanitizeQuery(query) {
        return this.isPlainObject(query) ? { ...query } : {};
    }

    mergeQuery(query = {}, extraFilter = {}) {
        const safe = this.sanitizeQuery(query);

        return {
            ...safe,
            customFilter: {
                ...(safe.customFilter || {}),
                ...extraFilter,
            },
        };
    }

    buildProjection(columns = []) {
        if (!Array.isArray(columns) || !columns.length) return null;
        return Object.fromEntries(columns.map((f) => [f, 1]));
    }

    /* ============================================================
          FILTER BUILDER
      ============================================================ */

    buildFilter(query = {}) {
        const filter = {
            ...this.defaultFilter,
            ...(query.customFilter || {}),
        };

        const includeDeleted = ["true", "1", true].includes(query.includeDeleted);

        if (this.softDelete && !includeDeleted) {
            filter.deletedAt = null;
        }

        if (query.search && this.searchFields.length) {
            const escaped = String(query.search).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
            );

            filter.$or = this.searchFields.map((field) => ({
                [field]: { $regex: escaped, $options: "i" },
            }));
        }

        return { filter, includeDeleted };
    }

    /* ============================================================
          OPTIONS
      ============================================================ */

    buildOptions(query = {}) {
        const page = Math.max(Number(query.page) || 1, 1);

        const limit = Math.min(
            Number(query.limit) || this.defaultLimit,
            this.maxLimit,
        );

        return {
            page,
            limit,
            skip: (page - 1) * limit,
            sort: query.sort || this.defaultSort,
        };
    }

    /* ============================================================
          FIND ALL ✅
      ============================================================ */

    async findAll(query = {}, columns = [], populate = []) {
        const safeQuery = this.sanitizeQuery(query);

        const { filter } = this.buildFilter(safeQuery);
        const { skip, limit, sort, page } = this.buildOptions(safeQuery);

        const projection = this.buildProjection(columns);

        let mongoQuery = this.model
            .find(filter)
            .select(projection)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        populate.forEach((p) => {
            mongoQuery = mongoQuery.populate(p);
        });

        const [data, total] = await Promise.all([
            mongoQuery,
            this.model.countDocuments(filter),
        ]);

        return this.success(data, {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        });
    }

    /* ============================================================
          FIND ONE
      ============================================================ */

    async findById(id, options = {}) {
        const filter = { _id: id };

        if (this.softDelete && !options.includeDeleted) {
            filter.deletedAt = null;
        }

        const doc = await this.model.findOne(filter);

        return this.success(doc);
    }

    /* ============================================================
          CREATE
      ============================================================ */

    async create(payload) {
        const doc = await this.model.create(payload);
        return this.success(doc);
    }

    /* ============================================================
          UPDATE
      ============================================================ */

    async updateById(id, payload) {
        const filter = { _id: id };

        if (this.softDelete) {
            filter.deletedAt = null;
        }

        const doc = await this.model.findOneAndUpdate(filter, payload, {
            new: true,
            runValidators: true,
        });

        return this.success(doc);
    }

    async updateAtomic(id, update) {
        return this.model.findByIdAndUpdate(id, update, { new: true });
    }

    /* ============================================================
          DELETE / RESTORE
      ============================================================ */

    async deleteById(id) {
        if (this.softDelete) {
            const doc = await this.updateAtomic(id, {
                deletedAt: new Date(),
            });

            return this.success(doc);
        }

        const doc = await this.model.findByIdAndDelete(id);
        return this.success(doc);
    }

    async restoreById(id) {
        if (!this.softDelete) return null;

        const doc = await this.updateAtomic(id, {
            deletedAt: null,
        });

        return this.success(doc);
    }
}
