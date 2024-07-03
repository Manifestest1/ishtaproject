const multer = require('multer');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) 
  {
    cb(null, './uploads/'); // Destination folder
  },
  filename: function (req, file, cb) 
  {
    // Extract file extension
    const extArray = file.originalname.split('.');
    const extension = extArray[extArray.length - 1]; 

    // Set custom filename
    cb(null, 'upload_images_' + Date.now() + '.' + extension);
  }
});

const uploadImages = multer({ storage: storage });

module.exports = uploadImages;