import mongoose from "mongoose";
import { baseSchemaFields, baseSchemaOptions } from "./baseSchema.js";

export const createModel = ({
    name,
    schemaDefinition,
    schemaOptions = {},
    plugins = [],
    setup // 👈 NEW
}) => {
    const schema = new mongoose.Schema(
        {
            ...schemaDefinition,
            ...baseSchemaFields
        },
        {
            ...baseSchemaOptions,
            ...schemaOptions
        }
    );

    // Apply plugins
    plugins.forEach(plugin => schema.plugin(plugin));

    // Apply hooks, methods, statics
    if (typeof setup === "function") {
        setup(schema);
    }

    return mongoose.model(name, schema);
};
