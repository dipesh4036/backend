import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    fullname: String,
    avatar: String,
    coverImage: String,
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        }
    ],
    refreshToken: String
}, { timestamps: true })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password); 
}

userSchema.methods.generateAccessToken =  function () {
    let AccessToken = jwt.sign({ id: this._id, email: this.email, username: this.username, fullname: this.fullname }, process.env.JWT_ACCESSTOKEN, { expiresIn: '10m' });
    return AccessToken
}
userSchema.methods.generateRefreshToken =  function () {
    let RefreshToken = jwt.sign({ id: this._id }, process.env.JWT_REFRESHTOKEN, { expiresIn: '24h' });
    return RefreshToken
}


export const User = mongoose.model("User", userSchema)