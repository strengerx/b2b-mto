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
         INTERNAL SAFETY HELPERS
      ============================================================ */
    isPlainObject(obj) {
        return (
            obj !== null && typeof obj === "object" && obj.constructor === Object
        );
    }

    sanitizeQuery(query) {
        if (!this.isPlainObject(query)) {
            return {};
        }

        // clone to prevent mutation
        return { ...query };
    }

    mergeQuery(query = {}, extraFilter = {}) {
        const safeQuery = this.sanitizeQuery(query);

        return {
            ...safeQuery,
            customFilter: {
                ...(safeQuery.customFilter || {}),
                ...extraFilter,
            },
        };
    }

    /* ============================================================
         FILTER BUILDER
      ============================================================ */
    buildFilter(query = {}) {
        query = this.sanitizeQuery(query);

        const filter = {
            ...this.defaultFilter,
            ...(query.customFilter || {}),
        };

        // includeDeleted normalization
        const includeDeleted = (() => {
            const v = query.includeDeleted;

            if (typeof v === "boolean") return v;

            if (typeof v === "string") {
                return ["1", "true", "yes"].includes(v.toLowerCase());
            }

            return false;
        })();

        // soft delete protection
        if (this.softDelete && !includeDeleted) {
            filter.deletedAt = null;
        }

        // search support
        if (query.search && this.searchFields.length) {
            const escaped = String(query.search).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&",
            );

            filter.$or = this.searchFields.map((field) => ({
                [field]: {
                    $regex: escaped,
                    $options: "i",
                },
            }));
        }

        return {
            filter,
            includeDeleted,
            search: query.search,
        };
    }

    /* ============================================================
         OPTIONS BUILDER
      ============================================================ */
    buildOptions(query = {}) {
        query = this.sanitizeQuery(query);

        const page = Math.max(Number(query.page) || 1, 1);

        const limit = Math.min(
            Number(query.limit) || this.defaultLimit,
            this.maxLimit,
        );

        const skip = (page - 1) * limit;

        return {
            page,
            limit,
            skip,
            sort: query.sort || this.defaultSort,
        };
    }

    /* ============================================================
         FIND ALL
      ============================================================ */
    async findAll(query = {}, columns = []) {
        const safeQuery = this.sanitizeQuery(query);

        const { filter, search, includeDeleted } = this.buildFilter(safeQuery);

        const { skip, limit, sort, page } = this.buildOptions(safeQuery);

        let projection = null;

        if (Array.isArray(columns) && columns.length) {
            projection = columns.reduce((acc, field) => {
                acc[field] = 1;
                return acc;
            }, {});
        }

        const [data, total] = await Promise.all([
            this.model
                .find(filter)
                .select(projection)
                .sort(sort)
                .skip(skip)
                .limit(limit),

            this.model.countDocuments(filter),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                ...(search && { search }),
                ...(this.softDelete && { includeDeleted }),
            },
        };
    }

    /* ============================================================
         FIND ONE
      ============================================================ */
    async findById(id, options = {}) {
        const includeDeleted = options.includeDeleted === true;

        if (this.softDelete && !includeDeleted) {
            return this.model.findOne({
                _id: id,
                deletedAt: null,
            });
        }

        return this.model.findById(id);
    }

    /* ============================================================
         CREATE
      ============================================================ */
    async create(payload) {
        return this.model.create(payload);
    }

    /* ============================================================
         UPDATE
      ============================================================ */
    async updateById(id, payload) {
        return this.model.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });
    }

    // ensures mongoose hooks run
    async updateByIdSafe(id, payload) {
        if (!payload || typeof payload !== "object") {
            return this.updateById(id, payload);
        }

        const doc = await this.model.findById(id);
        if (!doc) return null;

        Object.assign(doc, payload);
        await doc.save();

        return doc;
    }

    /* ============================================================
         DELETE / RESTORE
      ============================================================ */
    async deleteById(id) {
        if (this.softDelete) {
            return this.model.findByIdAndUpdate(
                id,
                { deletedAt: new Date() },
                { new: true },
            );
        }

        return this.model.findByIdAndDelete(id);
    }

    async restoreById(id) {
        if (!this.softDelete) return null;

        return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
    }
}
