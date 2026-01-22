import { refreshTokenCookie } from "../../config/cookie.config.js";
import { success } from "../../shared/responses/apiResponse.js";
import catchAsync from "../../shared/utils/catchAsync.js";
import * as authService from "./auth.service.js";
import { generateTokens } from "../../shared/security/jwt.js";

export const login = catchAsync(async (req, res) => {
    const credentials = { identifier: req.body.email, password: req.body.password };
    const user = await authService.verifyCredentials(credentials);

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie(refreshTokenCookie.name, refreshToken, { ...refreshTokenCookie });
    return success(res, { accessToken }, "Authentication successful");
});

export const logout = catchAsync(async (req, res) => success(res, null, "logout success"));