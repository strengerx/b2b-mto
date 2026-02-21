// Brand field whitelisting for responses
export const BRAND_FIELDS = Object.freeze({
    public: [
        "_id",
        "name",
        "slug",
        "description",
        "logo",
        "banner",
        "icon",
        "website",
        "country",
        "foundedYear",
        "labels",
        "socialLinks",
        "order",
        "isFeatured",
        "showInHomepage",
        "seo",
        "metrics",
        "status",
        "createdAt",
        "updatedAt"
    ],

    create: [
        "name",
        "slug",
        "description",
        "logo",
        "banner",
        "icon",
        "website",
        "country",
        "foundedYear",
        "labels",
        "socialLinks",
        "order",
        "isFeatured",
        "showInHomepage",
        "seo"
    ],

    update: [
        "name",
        "slug",
        "description",
        "logo",
        "banner",
        "icon",
        "website",
        "country",
        "foundedYear",
        "labels",
        "socialLinks",
        "order",
        "isFeatured",
        "showInHomepage",
        "seo",
        "status"
    ],

    admin: [
        "_id",
        "name",
        "slug",
        "description",
        "logo",
        "banner",
        "icon",
        "website",
        "country",
        "foundedYear",
        "labels",
        "socialLinks",
        "order",
        "isFeatured",
        "showInHomepage",
        "seo",
        "metrics",
        "status",
        "createdAt",
        "updatedAt",
        "deletedAt"
    ]
});

// Brand verification statuses
export const BRAND_VERIFICATION_STATUS = Object.freeze({
    UNVERIFIED: "unverified",
    PENDING: "pending",
    VERIFIED: "verified",
    SUSPENDED: "suspended"
});

// Sorting options
export const BRAND_SORT_OPTIONS = Object.freeze({
    NEWEST: "-createdAt",
    OLDEST: "createdAt",
    POPULAR: "-metrics.productCount",
    FEATURED: "-metrics.popularityScore",
    NAME_ASC: "name",
    NAME_DESC: "-name",
    TRENDING: "-updateAt"
});

// Min/Max constraints
export const BRAND_CONSTRAINTS = Object.freeze({
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 10,
    MAX_DESCRIPTION_LENGTH: 1000,
    MIN_FOUNDED_YEAR: 1800,
    MAX_FOUNDED_YEAR: new Date().getFullYear(),
    MAX_LABELS: 10
});
