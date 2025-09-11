import APIError from '../utils/APIerror.js'
import APIResponse from '../utils/APIResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new APIError(500, "somthing went wrong while generateing tokens")
    }
}

export const register = async (req, res) => {
    try {
        // get user detail from req.body
        const { email, fullname, password } = req.body

        // validation
        if (!email || !fullname || !password) {
            throw new APIError(400, "all fields are required")
        }

        // check if user already exists 
        const user = await User.findOne({
            $or: [
                { fullname: fullname },
                { email: email }
            ]
        })

        if (user) {
            throw new APIError(409, "user already exists")
        }

        // check avatar and cover image and upload them to cloudinary
        const avatarLocalPath = req.files?.avatar[0]?.path
        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
            coverImageLocalPath = req.files.coverImage[0].path
        }


        if (!avatarLocalPath) {
            throw new APIError(400, "avatar missing")
        }

        const avatarImage = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)


        // create user object - create entry 
        // remove password and refresh token from response 
        const createdUser = await User.create({
            fullname,
            avatar: avatarImage.url,
            coverImage: coverImage?.url || "",
            password,
            email
        })

        const newUser = await User.findById(createdUser._id).select('-password -refreshToken')
        if (!newUser) {
            throw new APIError(500, "somthing went wrong duraing register")
        }

        // check user creation and return response
        return res.status(201).json(
            new APIResponse(201, newUser, "user created successfully ✅")
        );
    } catch (error) {
        return res.status(500).json(
            new APIResponse(500, null, "User registration failed ❌")
        );
    }
}

export const login = async (req, res) => {
    try {
        // 1. req.body -> data
        const { email, password } = req.body
        // 2. vaildation
        if (!email && !password) {
            throw new APIError(400, "email or password is required")
        }
        // 3. find user
        const user = await User.findOne({ email })

        if (!user) {
            throw new APIError(400, "user is not register with us!")
        }
        // 4. password check
        const passwordCheck = await user.isPasswordCorrect(password)

        if (!passwordCheck) {
            throw new APIError(401, "password incurrect")
        }
        // 5. access and refreshToken generate
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
        // 6. cookie save tokens

        const newUser = await User.findOne(user._id).select('-password -refreshToken')
        const Options = {
            httpOnly: true,
            secure: true
        }
        return res
            .cookie("accessToken", accessToken, Options)
            .cookie("refreshToken", refreshToken, Options)
            .json(new APIResponse(200, { user: newUser }, "user logged in successully ✅"))

    } catch (error) {
        return res.status(500).json(
            new APIResponse(500, null, "User login failed ❌")
        );
    }
}

export const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: null } }, { new: true })

        const Options = {
            httpOnly: true,
            secure: true
        }

        return res
            .clearCookie("accessToken", "", Options)
            .clearCookie("refreshToken", "", Options)
            .json(new APIResponse(200, {}, "user logout successully ✅"))
    } catch (error) {
        return res.status(500).json(
            new APIResponse(500, null, "User logout failed ❌")
        );
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingrefreshToken) {
            throw new APIError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(incomingrefreshToken, process.env.JWT_REFRESHTOKEN)

        const user = await User.findById(decodedToken.id)

        if (!user) {
            throw new APIError(401, "Invaild Refresh Token")
        }

        if (incomingrefreshToken !== user.refreshToken) {
            throw new APIError(401, "refresh token is used")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        const Options = {
            httpOnly: true,
            secure: true
        }
        return res
            .cookie("accessToken", accessToken, Options)
            .cookie("refreshToken", newRefreshToken, Options)
            .json(new APIResponse(200, { accessToken, refreshToken: newRefreshToken }, "refresh token successfully ✅"))

    } catch (error) {
        return res.status(400).json(
            new APIResponse(400, null, "access token refresh failed ❌")
        );
    }
}

export const changeCurrentPassword = async (req, res) => {
    // 1. req.body -> old , new
    const { oldPassword, newPassword } = req.body

    // 2. userId find from middleware
    const user = await User.findById(req.user?.id)

    if (!user) {
        throw new APIError(401, "Unauthorized user")
    }

    // 3.checked password
    const checked = user.isPasswordCorrect(oldPassword)

    if (!checked) {
        throw new APIError(400, "invaild old password")
    }

    // 4. save password
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.json(new APIResponse(200, {}, "password change successfully ✅"))
}

export const currentUser = async (req, res) => {
    return res.json(new APIResponse(200, req.user, "current user fecth successfully✅"))
}

export const changeDetails = async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new APIError(400, "all field required")
    }
    const user = await User.findByIdAndUpdate(req.user?.id, {
        $set: { fullname, email: email }
    }, { new: true }).select('-password')

    return res.json(new APIResponse(200, user, "account details updated successfully✅"))
}

export const changeAvatar = async (req, res) => {
    const avatarLocalPath = req.files?.avatar[0].path


    if (!avatarLocalPath) {
        throw new APIError(400, "avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new APIError(400, "error while uploading avatar")
    }

    const avatarUpdate = await User.findByIdAndUpdate(req.user?.id, {
        $set: { avatar: avatar.url }
    }, { new: true }).select('-password')

    return res.json(new APIResponse(200, avatarUpdate, "avatar updated successfully✅"))

}

export const changeCoverImage = async (req, res) => {
    const coverImageLocalPath = req.files?.coverImage[0].path

    if (!coverImageLocalPath) {
        throw new APIError(400, "cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new APIError(400, "error while uploading cover image")
    }

    const coverImageUpdate = await User.findByIdAndUpdate(req.user?.id, {
        $set: { coverImage: coverImage.url }
    }, { new: true }).select('-password')

    return res.json(new APIResponse(200, coverImageUpdate, "cover image updated successfully✅"))
}

export const userChannelProfile = async (req, res) => {
    try {
        const {username} = req.params

        const channle = await User.aggregate([
            {
                $match : {
                    username : username?.toLowerCase()
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "Subscribers"
                }
            },{
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "SubscribeTo"
                }
            },{
                $addFields : {
                    SubscribersCount : {
                        $size : "$Subscribers"
                    },
                    channleSubscribedCount : {
                        $size : "$SubscribeTo"
                    }
                }
            }
        ])

        return res.json(new APIResponse(200, user, "user channel profile fetch successfully ✅"))
    } catch (error) {
        return res.status(500).json(
            new APIResponse(500, null, "User channel profile fetch failed ❌")
        );
    }
}

