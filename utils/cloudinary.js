import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import 'dotenv/config'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if (!filePath) return null;

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'ytbackend',
    });

    fs.unlinkSync(filePath);

    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return null;
  }
};

export { uploadOnCloudinary };
