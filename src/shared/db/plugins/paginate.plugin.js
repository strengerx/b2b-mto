export const paginatePlugin = (schema) => {
    schema.statics.paginate = async function ({
        page = 1,
        limit = 20,
        filter = {},
        sort = { createdAt: -1 }
    }) {
        const skip = (page - 1) * limit

        const [data, total] = await Promise.all([
            this.find(filter).sort(sort).skip(skip).limit(limit),
            this.countDocuments(filter)
        ])

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    }
}
