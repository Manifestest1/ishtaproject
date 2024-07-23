const express = require('express');
const cors = require('cors');
const app = express();
const { razorpay, crypto } = require('./razorpayConfig');
require('dotenv').config();

const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');
const { Admin } = require('./models');
const { FilterCategory } = require('./models'); 
const { Filter } = require('./models');
const { Image } = require('./models');
const { Plan } = require('./models');
const {ImageCredit} = require('./models');
const {UserPayment} = require('./models');
const {Order} = require('./models');

const SECRET_KEY = 'your_jwt_secret_key'; 
let blacklist = [];

app.use(bodyParser.json());
app.use(cors());
const upload = require('./multer'); // Multer middleware
const uploadImages = require('./multer_images/images')

const path = require('path');

// Define the directory for static files (uploads folder)
const uploadsDirectory = path.join(__dirname, 'uploads');
// Middleware to serve static files
app.use('/uploads', express.static(uploadsDirectory));


app.get('/', (req, res) =>{
    res.send("Hello World");
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try 
    {
      // Check if the email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) 
      {
        return res.status(409).json({
          message: 'Email already exists',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });
      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ message: 'User registered successfully', user,authorisation:token });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'User registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try 
    {
      const user = await User.findOne({ where: { email } });
      if (!user) 
      {
        return res.status(404).json({ error: 'User not found' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) 
      {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ message: 'Login successful', user, authorisation:token });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Login failed' });
    }
  });
  
  const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) 
    {
      return res.status(403).json({ error: 'No token provided' });
    }
     // Check if token is blacklisted
    if (blacklist.includes(token)) 
    {
        return res.status(401).json({ error: 'Token revoked. Please log in again' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) 
      {
        return res.status(500).json({ error: 'Failed to authenticate token' });
      }
      req.userId = decoded.id;
      next();
    });
  };
  
  app.get('/api/user', authMiddleware, async (req, res) => {
    try 
    {
      const user = await User.findByPk(req.userId);
      res.json({ user });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.post('/api/fasescape_image_upload', upload.single('file'), (req, res) => {
    try 
    {
      const file = req.file;
      if (!file) 
      {
        return res.status(400).send({ message: 'Please upload a file.' });
      }

      const imagePath = file.path;
      // await User.query().findById(userId).patch({ image: imagePath });
  
      return res.status(200).send({ message: 'File uploaded and user updated successfully.', imagePath });

      // Handle file upload success (e.g., save file path or other metadata in database)

    } 
    catch (err) 
    {
      console.error('Error uploading file:', err);
      return res.status(500).send({ message: 'Internal server error.' });
    }
  });

  app.post('/api/add_upload_images',authMiddleware, uploadImages.single('image'), async (req, res) => {
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
  });

 // Express route to fetch filtered data
app.get('/api/get_filters_data', async (req, res) => {
  try {
    // Fetch all data from the FilterCategory model
    const allFilterCategories = await FilterCategory.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
  
    // Fetch matched data from the Filter model with the corresponding FilterCategory
    const filters = await Filter.findAll({
      attributes: ['id', 'image', 'filter','api_key', 'category_id'], // Include all necessary attributes of Filter
      include: {
        model: FilterCategory,
        attributes: ['id', 'name', 'order_no'] // Include specific attributes of FilterCategory
      },
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
  
    // Format the response by grouping filters by category_id
    const groupedFilters = filters.reduce((acc, filter) => {
      const categoryId = filter.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category_id: categoryId,
          category_name: filter.FilterCategory.name,
          order_no: filter.FilterCategory.order_no,
          sub_categories: []
        };
      }
      acc[categoryId].sub_categories.push({
        id: filter.id,
        image: filter.image,
        filter: filter.filter,
        api_key: filter.api_key
      });
      return acc;
    }, {});
  
    // Convert the grouped object into an array
    const groupedFiltersArray = Object.values(groupedFilters);
  
    // Merge the data from FilterCategory and grouped filters
    const result = allFilterCategories.map(category => {
      return {
        ...category.dataValues,
        sub_categories: groupedFilters[category.id] ? groupedFilters[category.id].sub_categories : []
      };
    });
  
    return res.status(200).send({ message: 'Filter Data.', filters: result });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Error fetching filter data.', error });
  }
  
});

// Soft delete a Filter
app.put('/api/filter/:id/delete', async (req, res) => {
  const filterId = req.params.id;
  try 
  {
    const filter = await Filter.findByPk(filterId);
    if (!filter) 
    {
      return res.status(404).json({ error: 'Filter not found' });
    }
    // Soft delete user by setting deletedAt timestamp
    await filter.update({ deletedAt: new Date() });
    res.json({ message: `Filter ${filterId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
});

// Edit a Filter Category
app.put('/api/filter-category/:id/edit', async (req, res) => {
  const filtercatId = req.params.id;
  try 
  {
    const filter_cat = await FilterCategory.findByPk(filtercatId);
    if (!filter_cat) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    res.json({ message: `Edit Data get successfully`,filter_cat_data:  filter_cat});
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
});

app.post('/api/filter_category_update', async (req, res) => {
  console.log(req,"FRom user update")
  const {name,order_no,cat_id } = req.body;

  try 
  {
    // Update user's isActive status
    const updatedFilterCat = await FilterCategory.update({ name: name,order_no: order_no }, {
      where: { id: cat_id }
    });
    res.json({ message: 'Filter Category updated successfully' ,update_filter_cat: updatedFilterCat[0]});
  
  } 
  catch (error) 
  {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }

});

// Soft delete a Filter Category
app.put('/api/filter-category/:id/delete', async (req, res) => {
  const filtercatId = req.params.id;
  try 
  {
    const filter_cat = await FilterCategory.findByPk(filtercatId);
    if (!filter_cat) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    // Soft delete user by setting deletedAt timestamp
    await filter_cat.update({ deletedAt: new Date() });
    res.json({ message: `FilterCategory ${filtercatId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
});

// Start RazorPay Api
app.post("/api/create-order", async (req, res) => {

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
})

app.post("/api/order-validate", async (req, res) => {

  const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body

  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET_ID);
  // order_id + " | " + razorpay_payment_id

  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);

  const digest = sha.digest("hex");

  if (digest!== razorpay_signature) {
      return res.status(400).json({msg: " Transaction is not legit!"});
  }

  res.json({msg: " Transaction is legit!", orderId: razorpay_order_id,paymentId: razorpay_payment_id});
})

app.post('/api/add_payment_detail', authMiddleware, async (req, res) => {
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
});

// End RazorPay Api

//   Start Admin Api

  app.post('/api/admin_login', async (req, res) => {
    const { email, password } = req.body;
    try 
    {
        const admin = await Admin.findOne({ where: { email } });
        if (!admin) 
        {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) 
        {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: admin.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Login successful', admin, authorisation:token });
    } 
    catch (error) 
    {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/admin_user', authMiddleware, async (req, res) => {
    try 
    {
      const user = await Admin.findByPk(req.userId); 
      res.json({ user });
    } 
    catch (error) 
    {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.get('/api/get_all_users', authMiddleware, async (req, res) => {
  try 
  {
    // const users = await User.findAll();
    const users = await User.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(users);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/user_status_update', async (req, res) => {
  console.log(req,"FRom user update")
  const { userId, newStatus } = req.body;

  try 
  {
    // Update user's isActive status
    const updatedUser = await User.update({ is_active: newStatus }, {
      where: { id: userId }
    });

    if (updatedUser[0] === 1) 
    {
      res.json({ message: 'User status updated successfully' ,update_user: updatedUser[0]});
    } 
    else 
    {
      res.status(404).json({ error: 'User not found or status not updated', update_user: 0 });
    }
  } 
  catch (error) 
  {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }

});

app.post('/api/add_filters_category', async (req, res) => { 
  const { name, order_no } = req.body;
  try 
  {
    const add_filters_category = await FilterCategory.create({ name, order_no });
    return res.status(200).send({ message: 'Filter Data.', add_filters_category: add_filters_category });
    //res.json({ message: 'User status updated successfully' ,add_filters_category: add_filters_category});
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/get_filters_category', async (req, res) => { 
  try 
  {
    const categories = await FilterCategory.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(categories);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/add_filters_data', upload.single('image'), async (req, res) => {
  const { category_id, filter, api_key } = req.body;
  const file = req.file;
  const image = file.path;
  console.log(req,"Filter Api");
  try 
  {
    const add_filters_data = await Filter.create({ category_id, filter,api_key,image });
    return res.status(200).send({ message: 'Filter Data.', filters: add_filters_data });
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Soft delete a user
app.put('/api/user/:id/delete', async (req, res) => {
  const userId = req.params.id;
  try 
  {
    const user = await User.findByPk(userId);
    if (!user) 
    {
      return res.status(404).json({ error: 'User not found' });
    }
    // Soft delete user by setting deletedAt timestamp
    await user.update({ deletedAt: new Date() });
    res.json({ message: `User ${userId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${userId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${userId}` });
  }
});

// credit api

app.post('/api/user_credit_balance_deduct', authMiddleware, async (req, res) => {
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
});

app.post('/api/add_credit_data', async (req, res) => { 
  const { label, value, credit } = req.body;
  try 
  {
    const add_credit_data = await Plan.create({ label, value, credit });
    return res.status(200).send({ message: 'Credit Data.', add_credit_data: add_credit_data });
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/get_credits_data', authMiddleware, async (req, res) => {
  try 
  {
    // const users = await User.findAll();
    const credit_data = await Plan.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(credit_data);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/credit-data/:id/edit', async (req, res) => {
  const creditId = req.params.id;
  try 
  {
    const credit_data = await Plan.findByPk(creditId);
    if (!credit_data) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    res.json({ message: `Edit Data get successfully`,credit_edit_data:  credit_data});
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${creditId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${creditId}` });
  }
});

app.post('/api/credit_data_update', async (req, res) => {
  console.log(req,"FRom user update")
  const {label,value,credit,credit_id } = req.body;

  try 
  {
    // Update user's isActive status
    const updatedFilterCat = await Plan.update({ label: label,value: value,credit:credit }, {
      where: { id: credit_id }
    });
    res.json({ message: 'Filter Category updated successfully' ,update_filter_cat: updatedFilterCat[0]});
  
  } 
  catch (error) 
  {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }

});

app.put('/api/credit-data/:id/delete', async (req, res) => {
  const creditId = req.params.id;
  try 
  {
    const credit_data = await Plan.findByPk(creditId);
    if (!credit_data) 
    {
      return res.status(404).json({ error: 'Filter Category not found' }); 
    }
    // Soft delete user by setting deletedAt timestamp
    await credit_data.update({ deletedAt: new Date() });
    res.json({ message: `Plan ${creditId} soft-deleted successfully` });
  } 
  catch (error) 
  {
    console.error(`Error soft-deleting user ${creditId}:`, error);
    res.status(500).json({ error: `Failed to soft-delete user ${creditId}` });
  }
});

app.post('/api/set_credit_image', async (req, res) => {
  const { image_credit } = req.body;
  try {
    let set_credit_data;

    // Check if there is already existing data
    const existingCreditData = await ImageCredit.findOne();

    if (existingCreditData) {
      // Update the existing entry
      existingCreditData.image_credit = image_credit;
      set_credit_data = await existingCreditData.save();
    } else {
      // Create a new entry
      set_credit_data = await ImageCredit.create({ image_credit });
    }

    return res.status(200).send({ message: 'Credit Data.', set_credit_data });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error occurred.' });
  }
});

// Order Api

app.get('/api/get_orders_data', authMiddleware, async (req, res) => {
  try 
  {
    // const users = await User.findAll();
    const orders_data = await Order.findAll({
      where: {
        deletedAt: null // Filter out soft-deleted users
      }
    });
    res.json(orders_data);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

  //   End Admin Api

  app.post('/api/logout', authMiddleware, (req, res) => {
     // Add the token to the blacklist
     blacklist.push(req.headers['authorization']);
    // For simplicity, let's just respond with a success message
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = app