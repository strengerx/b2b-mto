import { created, success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { userService } from "./users.service.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import AppError from "../../shared/errors/AppError.js";
import { USER_FIELDS } from "./users.constants.js";

/* ============================================================
    FORMATTER
============================================================ */

const formatUser = (user) => {
    if (!user) return null;
    return pickFields(user.toObject ? user.toObject() : user, USER_FIELDS.public);
};


/* ============================================================
    LIST USERS
============================================================ */

export const index = catchAsync(async (req, res) => {
    const result = await userService.findAll(req.query, USER_FIELDS.public);
    return success(res, result.data.map(formatUser), "All users", 200, result.meta);
});


/* ============================================================
    CREATE USER
============================================================ */

export const store = catchAsync(async (req, res) => {
    const result = await userService.create(req.body);
    return created(res, formatUser(result.data), "User created successfully");
});


/* ============================================================
    CURRENT USER
============================================================ */

export const me = catchAsync(async (req, res) => {
    const result = await userService.findById(req.user.id);
    if (!result.data) throw new AppError("User not found", 404);
    return success(res, formatUser(result.data), "Current user");
});


/* ============================================================
    UPDATE CURRENT USER
============================================================ */

export const updateMe = catchAsync(async (req, res) => {
    const allowedUpdates = pickFields(req.body, USER_FIELDS.update);
    const result = await userService.updateById(req.user.id, allowedUpdates);
    if (!result.data) throw new AppError("User not found", 404);
    return success(res, formatUser(result.data), "Profile updated");
});


/* ============================================================
    SHOW USER
============================================================ */

export const show = catchAsync(async (req, res) => {
    const result = await userService.findById(req.params.id);
    if (!result.data) throw new AppError("User not found", 404);
    return success(res, formatUser(result.data), "User retrieved");
});


/* ============================================================
    UPDATE USER (ADMIN)
============================================================ */

export const update = catchAsync(async (req, res) => {
    const allowedUpdates = pickFields(req.body, USER_FIELDS.update);
    const result = await userService.updateById(req.params.id, allowedUpdates);

    if (!result.data)
        throw new AppError("User not found", 404);

    return success(
        res,
        formatUser(result.data),
        "User updated"
    );
});


/* ============================================================
    DELETE USER
============================================================ */

export const destroy = catchAsync(async (req, res) => {

    const result =
        await userService.deleteById(
            req.params.id
        );

    if (!result?.data)
        throw new AppError("User not found", 404);

    return success(
        res,
        null,
        "User deleted"
    );
});


/* ============================================================
    RESTORE USER
============================================================ */

export const restore = catchAsync(async (req, res) => {

    const result =
        await userService.restoreById(
            req.params.id
        );

    if (!result?.data)
        throw new AppError(
            "User not found or not deleted",
            404
        );

    return success(
        res,
        formatUser(result.data),
        "User restored"
    );
});