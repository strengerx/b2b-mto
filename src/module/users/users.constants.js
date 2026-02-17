export const ROLES = {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    STAFF: "STAFF",
    CLIENT: "CLIENT"
}

export const USER_FIELDS = Object.freeze({
    public: [
        "_id",
        "name",
        "email",
        "role",
        "createdAt",
        "updatedAt"
    ],

    create: [
        "name",
        "email",
        "password",
        "role"
    ],

    update: [
        "name",
        "email"
    ],

    roleUpdate: [
        "role"
    ],

    admin: [
        "_id",
        "name",
        "email",
        "role",
        "createdAt",
        "updatedAt",
        "__v"
    ]
});
