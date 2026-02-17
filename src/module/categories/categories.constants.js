export const MAX_CATEGORY_DEPTH = 3;
export const MIN_CATEGORY_NAME_LENGTH = 2;
export const MAX_CATEGORY_NAME_LENGTH = 100;

export const CATEGORY_FIELDS = Object.freeze({
    public: [
        "_id",
        "name",
        "slug",
        "description",
        "labels",
        "parentId",
        "icon",
        "image",
        "order",
        "isFeatured",
        "showInMenu",
        "seo",
        "status",
        "createdAt",
        "updatedAt"
    ],

    update: [
        "name",
        "slug",
        "description",
        "labels",
        "parentId",
        "icon",
        "image",
        "order",
        "isFeatured",
        "showInMenu",
        "seo",
        "status"
    ],

    create: [
        "name",
        "slug",
        "description",
        "labels",
        "parentId",
        "icon",
        "image",
        "order",
        "isFeatured",
        "showInMenu",
        "seo",
        "status"
    ],

    admin: [
        "_id",
        "name",
        "slug",
        "description",
        "labels",
        "parentId",
        "icon",
        "image",
        "order",
        "isFeatured",
        "showInMenu",
        "seo",
        "status",
        "createdAt",
        "updatedAt",
        "__v"
    ]
});
