const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// For chat images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chatmern/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
  },
});

// For avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chatmern/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 300, height: 300, crop: "fill", gravity: "face" }],
  },
});

exports.uploadImage = multer({ storage: imageStorage, limits: { fileSize: 10 * 1024 * 1024 } });
exports.uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
exports.cloudinary = cloudinary;
