import mongoose from "mongoose"

export const baseSchemaFields = {
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}

export const baseSchemaOptions = {
    timestamps: true,
    versionKey: false
}
