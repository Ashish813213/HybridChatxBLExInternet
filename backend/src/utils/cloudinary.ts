import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hybridchat/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hybridchat/documents',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: false,
  },
});

export const uploadImage = multer({ storage: imageStorage });
export const uploadDocument = multer({ storage: documentStorage });

export default cloudinary;