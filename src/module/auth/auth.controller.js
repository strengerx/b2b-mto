import { success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";

export const login = catchAsync(async (req, res) => success(res, null, "login success"));
export const logout = catchAsync(async (req, res) => success(res, null, "logout success"));