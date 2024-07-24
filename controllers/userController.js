const { User,Image,ImageCredit,UserPayment } = require('../models'); // Adjust path as per your project structure
const { razorpay, crypto } = require('../razorpayConfig');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const blacklist = [];

exports.user = async (req, res) => {
    try 
    {
        const user = await User.findByPk(req.userId);
        if (!user) 
        {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } 
    catch (error) 
    {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

exports.add_upload_images = async (req, res) => {
    const user_id = req.userId;
    const file = req.file;
    const image = file.path;
    console.log(req,"Filter Api");
    try 
    {
      const add_images_data = await Image.create({ user_id,image });

      return res.status(200).send({ message: 'Filter Data.', images: add_images_data });
      
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'image not upload' });
    }
}

exports.user_credit_balance_deduct = async (req, res) => {

    const { batchsize } = req.body;
    try 
    {
       // Start User Credit Balance Logic
   
       const user = await User.findByPk(req.userId);
       const imagecredit = await ImageCredit.findOne();
       const user_credit_balance = user.credit_balance - (imagecredit.image_credit * batchsize);
  
       const updated_user_credit = await User.update({ credit_balance:  user_credit_balance}, { 
         where: { id: req.userId }
       });
  
       // End Credit Balance Logic
      res.json({ updated_user_credit });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
}

exports.create_order = async (req, res) => {
    try {

        if(!req.body)
        {
            return res.status(400).send("Bad Request");
        }
        const options = req.body;
        const order = await razorpay.orders.create(options);
  
        if(!order)
        {
          return res.status(400).send("Bad Request");
        }
  
        res.json(order);
        
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

exports.validate_order = async (req, res) => {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_ID);
    // order_id + " | " + razorpay_payment_id
  
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  
    const digest = sha.digest("hex");
  
    if (digest!== razorpay_signature) {
        return res.status(400).json({msg: " Transaction is not legit!"});
    }
  
    res.json({msg: " Transaction is legit!", orderId: razorpay_order_id,paymentId: razorpay_payment_id});
}

exports.add_payment_detail = async (req, res) => {
        const user_id = req.userId;
        const { order_payment_id, payment_id, payment, credit } = req.body;
        
        try {
          // Parse credit amount from request body
          const parsedCredit = parseInt(credit);
      
          // Find user by user_id
          const user = await User.findByPk(user_id);
      
          // Calculate new credit balance
          const user_credit_balance = parseInt(user.credit_balance) + parsedCredit;
      
          // Update user's credit balance in the database
          await User.update(
            { credit_balance: user_credit_balance }, 
            { where: { id: user_id } }
          );
      
          // Fetch updated user data after update
          const updatedUser = await User.findByPk(user_id);
      
          // Create payment detail record
          const add_payment_detail = await UserPayment.create({ 
            user_id, 
            order_payment_id, 
            payment_id,
            payment, 
            credit 
          });
      
          // Return response with updated credit balance and payment detail
          return res.status(200).send({ 
            message: 'Payment Detail Data.',
            user_credit_balance: updatedUser,
            add_payment_detail
          });
        } catch (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'An error occurred while processing the request.' });
        }
      
}

exports.logout = async (req, res) => {
    // Add the token to the blacklist
    blacklist.push(req.headers['authorization']);
    // For simplicity, let's just respond with a success message
    res.json({ success: true, message: 'Logged out successfully' });
}
