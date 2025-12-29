/**
 * File Upload Configuration
 *
 * Handles image and file uploads with:
 * - Size limits
 * - Type validation
 * - Image compression via Sharp
 * - Secure file naming
 */

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;

// Allowed image types
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Allowed file types (for paid tier)
const FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

// Max sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB before compression
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_PROFILE_SIZE = 5 * 1024 * 1024; // 5MB

// Compressed image dimensions
const IMAGE_MAX_WIDTH = 1920;
const IMAGE_MAX_HEIGHT = 1080;
const PROFILE_SIZE = 400;
const THUMBNAIL_SIZE = 200;

/**
 * Storage configuration for multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = IMAGE_TYPES.includes(file.mimetype);
    const folder = isImage ? 'uploads/images' : 'uploads/files';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${uuidv4()}${ext}`;
    cb(null, name);
  }
});

/**
 * File filter for validation
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [...IMAGE_TYPES, ...FILE_TYPES];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

/**
 * Image-only filter
 */
const imageFilter = (req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

/**
 * Multer upload instances
 */
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }
});

const uploadFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadProfile = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_PROFILE_SIZE }
});

/**
 * Process uploaded image - compress and resize
 */
async function processImage(filePath, options = {}) {
  const {
    maxWidth = IMAGE_MAX_WIDTH,
    maxHeight = IMAGE_MAX_HEIGHT,
    quality = 85,
    format = 'webp'
  } = options;

  const outputPath = filePath.replace(/\.[^.]+$/, `.${format}`);

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if needed
    let resizeOptions = {};
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      resizeOptions = {
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      };
    }

    // Process and save
    await image
      .resize(resizeOptions)
      .webp({ quality })
      .toFile(outputPath);

    // Remove original if different format
    if (outputPath !== filePath) {
      await fs.unlink(filePath);
    }

    return {
      path: outputPath,
      filename: path.basename(outputPath),
      url: `/uploads/images/${path.basename(outputPath)}`
    };
  } catch (err) {
    console.error('Image processing error:', err);
    throw err;
  }
}

/**
 * Process profile photo - resize to square
 */
async function processProfilePhoto(filePath) {
  const outputPath = filePath.replace(/\.[^.]+$/, '.webp');

  try {
    await sharp(filePath)
      .resize(PROFILE_SIZE, PROFILE_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 90 })
      .toFile(outputPath);

    // Remove original if different format
    if (outputPath !== filePath) {
      await fs.unlink(filePath);
    }

    return {
      path: outputPath,
      filename: path.basename(outputPath),
      url: `/uploads/images/${path.basename(outputPath)}`
    };
  } catch (err) {
    console.error('Profile photo processing error:', err);
    throw err;
  }
}

/**
 * Create thumbnail for an image
 */
async function createThumbnail(filePath) {
  const ext = path.extname(filePath);
  const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);

  try {
    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    return {
      path: thumbnailPath,
      filename: path.basename(thumbnailPath),
      url: `/uploads/images/${path.basename(thumbnailPath)}`
    };
  } catch (err) {
    console.error('Thumbnail creation error:', err);
    throw err;
  }
}

/**
 * Delete uploaded file
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    console.error('File deletion error:', err);
    return false;
  }
}

/**
 * Get file info
 */
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (err) {
    return null;
  }
}

module.exports = {
  uploadImage,
  uploadFile,
  uploadProfile,
  processImage,
  processProfilePhoto,
  createThumbnail,
  deleteFile,
  getFileInfo,
  IMAGE_TYPES,
  FILE_TYPES
};
