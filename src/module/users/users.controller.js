import { created, success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import { userService } from "./users.service.js";
import { pickFields } from "../../shared/utils/pickFields.js";

export const index = catchAsync(async (req, res) => {
    const result = await userService.findAll(req.query);
    return success(res, result.data, "All Users", 200, result.meta);
});

export const store = catchAsync(async (req, res) => {
    const newUser = await userService.create(req.body);
    const user = pickFields(newUser.toObject(), ["name", "email"]);
    return created(res, user, "User created successfully");
});

export const me = catchAsync(async (req, res) => {
    const user = await userService.findById(req.user.id);
    if (!user) return success(res, null, "User not found", 404);
    return success(res, pickFields(user.toObject(), ["name", "email", "role"]), "Current user");
});

export const updateMe = catchAsync(async (req, res) => {
    const updated = await userService.updateByIdSafe(req.user.id, req.body);
    if (!updated) return success(res, null, "User not found", 404);
    return success(res, pickFields(updated.toObject(), ["name", "email", "role"]), "Profile updated");
});

export const show = catchAsync(async (req, res) => {
    const user = await userService.findById(req.params.id);
    if (!user) return success(res, null, "User not found", 404);
    return success(res, pickFields(user.toObject(), ["name", "email", "role"]), "User retrieved");
});

export const update = catchAsync(async (req, res) => {
    const updated = await userService.updateByIdSafe(req.params.id, req.body);
    if (!updated) return success(res, null, "User not found", 404);
    return success(res, pickFields(updated.toObject(), ["name", "email", "role"]), "User updated");
});

export const destroy = catchAsync(async (req, res) => {
    await userService.deleteById(req.params.id);
    return success(res, null, "User deleted");
});

export const restore = catchAsync(async (req, res) => {
    const restored = await userService.restoreById(req.params.id);
    if (!restored) return success(res, null, "User not found or not deleted", 404);
    return success(res, pickFields(restored.toObject(), ["name", "email", "role"]), "User restored");
});
