const multer = require('multer');
const path = require('path');
const { AppError } = require('./errorHandler');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store files based on type
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'labResults') {
      uploadPath += 'lab/';
    } else if (file.fieldname === 'medicalRecords') {
      uploadPath += 'records/';
    } else if (file.fieldname === 'prescriptions') {
      uploadPath += 'prescriptions/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only PDF, JPEG and PNG allowed', 400), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

module.exports = { upload };