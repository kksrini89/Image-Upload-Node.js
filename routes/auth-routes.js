const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { verifyToken } = require('./../utils/util');
const authController = require('./../controllers/authController');
const config = require('../config/config');
const profile_path = path.join(__dirname, config.profile_upload_path);
const dealer_path = path.join(__dirname, config.dealer_upload_path);
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const path = file.fieldname === 'dealer_image' ? dealer_path : profile_path;
    cb(null, path);
  },
  filename: function(req, file, cb) {
    console.log(file);
    // const fileName = `${file.originalname}-${uuid.v4()}`;
    const extension = `${file.mimetype.split('/').pop()}`;
    const fileName = `${new Date().getTime()}.${extension}`;
    cb(null, fileName);

    // cb(null, file.originalname);
    // cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload = multer({
  storage: storage,
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  }
});

const imageUpload = upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'dealer_image', maxCount: 1 }
]);

// router.post('/register', upload.single('photo'), authController.resize, authController.register);
router.post('/register', imageUpload, authController.resize, authController.register);
router.post('/login', authController.login);

// router.post('/account/forgot', catchErrors(authController.forgot));
// router.get('/account/reset/:token', catchErrors(authController.reset));
// router.post('/account/reset/:token',
//   authController.confirmedPasswords,
//   catchErrors(authController.update)
// );
router.post('/forgot_password', authController.forgotPassword);

// Get one image by its ID
router.get('/images/:id/:type', authController.getImage);

module.exports = router;
