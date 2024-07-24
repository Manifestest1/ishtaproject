const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../multer'); // Multer middleware

router.get('/admin_user', adminController.admin_user);
router.get('/get_all_users', adminController.get_all_users); 
router.post('/user_status_update', adminController.user_status_update);
router.put('/user/:id/delete', adminController.user_delete);

// Filter Api

router.post('/add_filters_data',upload.single('image'), adminController.add_filter_data);
router.get('/get_filters_data', adminController.get_filters_data);
router.put('/filter/:id/delete', adminController.delete_filters_data); 
router.put('/filter-category/:id/edit', adminController.edit_filter_category); 
router.post('/filter_category_update', adminController.update_filter_category);
router.post('/add_filters_category', adminController.add_filters_category);
router.put('/filter-category/:id/delete', adminController.delete_filter_category); 
router.get('/get_filters_category', adminController.get_filters_category);

// Plan api
router.post('/add_credit_data', adminController.add_plan_data);
router.get('/get_credits_data', adminController.get_plan_data);
router.put('/credit-data/:id/edit', adminController.edit_plan_data);
router.post('/credit_data_update', adminController.update_plan_data);
router.put('/credit-data/:id/delete', adminController.delete_plan_data); 

router.post('/set_credit_image', adminController.set_credit_plan);

// Order Api
router.get('/get_orders_data', adminController.get_orders_data);


module.exports = router;
