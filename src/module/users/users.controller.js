import { created, success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { userService } from "./users.service.js";
import { pickFields } from "../../shared/utils/pickFields.js";
import AppError from "../../shared/errors/AppError.js";
import { USER_FIELDS } from "./users.constants.js";

const formatUser = (user) => {
    if (!user) return null;
    return pickFields(user.toObject(), USER_FIELDS.public);
};

export const index = catchAsync(async (req, res) => {
    const result = await userService.findAll(req.query, USER_FIELDS.public);
    return success(res, result.data, "All users", 200, result.meta);
});

export const store = catchAsync(async (req, res) => {
    const newUser = await userService.create(req.body);
    return created(res, formatUser(newUser), "User created successfully");
});

export const me = catchAsync(async (req, res) => {
    const user = await userService.findById(req.user.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return success(res, formatUser(user), "Current user");
});

export const updateMe = catchAsync(async (req, res) => {
    const updated = await userService.updateByIdSafe(req.user.id, req.body);

    if (!updated) {
        throw new AppError("User not found", 404);
    }

    return success(res, formatUser(updated), "Profile updated");
});

export const show = catchAsync(async (req, res) => {
    const user = await userService.findById(req.params.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    return success(res, formatUser(user), "User retrieved");
});

export const update = catchAsync(async (req, res) => {
    const allowedUpdates = pickFields(req.body, USER_FIELDS.update)
    const updated = await userService.updateByIdSafe(req.params.id, allowedUpdates);

    if (!updated) {
        throw new AppError("User not found", 404);
    }

    return success(res, formatUser(updated), "User updated");
});

export const destroy = catchAsync(async (req, res) => {
    const deleted = await userService.deleteById(req.params.id);

    if (!deleted) {
        throw new AppError("User not found", 404);
    }

    return success(res, null, "User deleted");
});

export const restore = catchAsync(async (req, res) => {
    const restored = await userService.restoreById(req.params.id);

    if (!restored) {
        throw new AppError("User not found or not deleted", 404);
    }

    return success(res, formatUser(restored), "User restored");
});
