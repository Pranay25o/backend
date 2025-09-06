
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
    
        // 1. Extract token from either cookies or Authorization header
        console.log(req.cookies)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // 2. Check if a token was found
        console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }
  
        // 3. Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SCREATE);
        

        // 4. Find the user based on the decoded token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // This handles cases where the token is valid but the user has been deleted
            throw new ApiError(401, "Invalid Access Token");
        }

        // 5. Attach the user object to the request for use in subsequent controllers
        req.user=user;
        next();

    } catch (error) {
        // This will catch expired tokens or tampered tokens
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});