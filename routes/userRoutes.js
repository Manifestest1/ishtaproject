const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

const uploadImages = require('../multer_images/images')

router.get('/user', userController.user);
router.post('/user_credit_balance_deduct', userController.user_credit_balance_deduct); 

// Facescape images added
router.post('/add_upload_images',uploadImages.single('image'), userController.add_upload_images); 

// RazorPay Api
router.post('/create-order', userController.create_order); 
router.post('/order-validate', userController.validate_order); 
router.post('/add_payment_detail', userController.add_payment_detail);  


router.post('/logout', userController.logout);

module.exports = router;
