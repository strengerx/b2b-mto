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

        // Soft delete
        if (this.softDelete && !query.includeDeleted) {
            filter.deletedAt = null;
        }

        // Search
        if (query.search && this.searchFields.length) {
            filter.$or = this.searchFields.map(field => ({
                [field]: { $regex: query.search, $options: 'i' }
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

    async findById(id) {
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

    async deleteById(id) {
        if (this.softDelete) {
            return this.model.findByIdAndUpdate(id, {
                deletedAt: new Date()
            });
        }
        return this.model.findByIdAndDelete(id);
    }
}
