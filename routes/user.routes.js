import express from 'express'
import { register, login, logout, refreshAccessToken, changeCurrentPassword, currentUser, changeDetails, changeAvatar, changeCoverImage } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { usermiddleware } from '../middlewares/user.middleware.js'

const router = express.Router()

router.post('/register', upload.fields(
    [{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }])
    , register)
router.post('/login', login)
router.get('/logout', usermiddleware, logout)
router.post('/refresh-token', refreshAccessToken)
router.post('/change-password', usermiddleware, changeCurrentPassword)
router.get('/currentuser', usermiddleware, currentUser)
router.post('/change-details', usermiddleware, changeDetails)
router.post('/change-avatar', usermiddleware, upload.fields([{ name: 'avatar', maxCount: 1 }]), changeAvatar)
router.post('/change-coverimage', usermiddleware, upload.fields([{ name: 'coverImage', maxCount: 1 }]), changeCoverImage)
export default router