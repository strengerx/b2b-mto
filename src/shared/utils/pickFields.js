export const pickFields = (obj, allowedFields = []) => {
    const result = {};

    allowedFields.forEach((field) => {
        if (obj[field] !== undefined) {
            result[field] = obj[field];
        }
    });

    return result;
};
