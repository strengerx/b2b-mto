import catchAsync from "../../shared/utils/catchAsync.js";
import { success } from "../../shared/responses/apiResponse.js";

export const index = catchAsync(async (req, res) => {
    return success(res, null, "products index")
})

export const store = catchAsync(async (req, res) => {
    return success(res, null, "products store")
})

export const show = catchAsync(async (req, res) => {
    return success(res, null, "products show")
})

export const update = catchAsync(async (req, res) => {
    return success(res, null, "products update")
})

export const destroy = catchAsync(async (req, res) => {
    return success(res, null, "products destroy")
})