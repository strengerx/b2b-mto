import { createModel } from "../../shared/db/baseModel.js"
import { softDeletePlugin } from "../../shared/db/plugins/softDelete.plugin.js"
import { hashPassword } from "../../shared/security/bcrypt.js";
import { ROLES } from "./users.constants.js"

const userSchema = {
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: "CLIENT",
        required: true
    }
}

export const User = createModel({
    name: "User",
    schemaDefinition: userSchema,
    plugins: [softDeletePlugin],
    setup(schema) {
        schema.pre("save", async function () {
            if (!this.isModified("password")) return;
            this.password = await hashPassword(this.password);
        });
    }
})
