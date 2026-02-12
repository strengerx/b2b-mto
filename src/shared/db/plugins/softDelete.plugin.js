export const softDeletePlugin = (schema) => {
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
            index: true
        }
    })

    schema.methods.softDelete = function () {
        this.deletedAt = new Date()
        this.isActive = false
        return this.save()
    }
}

// NOTE: soft-delete plugin only provides the field and helper method.
// Filtering of deleted records is intentionally handled at the service
// layer (`BaseService`) to keep behavior explicit and testable.

