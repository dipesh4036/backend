import APIError from "../utils/APIerror.js"
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js"

export const usermiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("authorization")?.replace("bearer", "")

        if (!accessToken) {
            throw new APIError(401, "Unauthorized User")
        }
        let decodedUser = jwt.verify(accessToken, process.env.JWT_ACCESSTOKEN);

        const user = await User.findById(decodedUser?.id).select('-password -refreshToken')
        
        if (!user) {
            throw new APIError(401, "Invaild Access Token")
        }
        req.user = user

        next()
    } catch (error) {
        next(error)
    }
}