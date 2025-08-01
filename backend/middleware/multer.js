const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "splitra", // optional: organizes uploads
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    transformation: [{ width: 800, crop: "limit" }], // optional
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".png", ".jpg", ".jpeg", ".pdf"];
  const ext = require("path").extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
