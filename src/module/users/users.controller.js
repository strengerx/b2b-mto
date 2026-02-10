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
