import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        jti: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        expiresAt: {
            type: Date,
            required: true,
            index: true
        },

        revokedAt: {
            type: Date,
            default: null,
            index: true
        },

        device: {
            type: String
        },

        ip: {
            type: String
        },

        userAgent: {
            type: String
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshToken = mongoose.model(
    "RefreshToken",
    refreshTokenSchema
);
