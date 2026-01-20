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

    schema.pre(/^find/, function () {
        this.where({ deletedAt: null })
    })
}
