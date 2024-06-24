const express = require('express');
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');
const { Admin } = require('./models');
const { FilterCategory } = require('./models');
const { Filter } = require('./models');

const SECRET_KEY = 'your_jwt_secret_key'; 
let blacklist = [];

app.use(bodyParser.json());
app.use(cors());
const upload = require('./multer'); // Multer middleware
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

  app.get('/api/get_filters_data', async (req, res) => {
    try {
      const filters = await Filter.findAll({
        include: {
          model: FilterCategory,
          attributes: ['id', 'name','order_no'] // Specify attributes you want to include from FilterCategory
        }
      });
  
      // Group filters by category_id
      const groupedFilters = filters.reduce((acc, filter) => {
        const categoryId = filter.category_id;
        if (!acc[categoryId]) 
        {
          acc[categoryId] = {
            category_id: categoryId,
            category_name: filter.FilterCategory.name,
            order_no: filter.FilterCategory.order_no,
            sub_categories: []
          };
        }
        acc[categoryId].sub_categories.push({id: filter.id,image: filter.image,sub_category:filter.sub_category});
        return acc;
      }, {});
  
      // Convert the grouped object into an array
      const groupedFiltersArray = Object.values(groupedFilters);
  
      return res.status(200).send({ message: 'Filter Data.', filters: groupedFiltersArray });
    } catch (error) {
      return res.status(500).send({ message: 'Error fetching filter data.', error });
    }
  });

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
    res.json({ message: 'User status updated successfully' ,add_filters_category: add_filters_category});
    
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/get_filters_category', async (req, res) => { 
  try 
  {
    const categories = await FilterCategory.findAll();
    res.json(categories);
  } 
  catch (error) 
  {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/add_filters_data', upload.single('image'), async (req, res) => {
  const { category_id, sub_category } = req.body;
  const file = req.file;
  const image = file.path;
  console.log(req,"Filter Api");
  try 
  {
    const add_filters_data = await Filter.create({ category_id, sub_category,image });
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

  //   End Admin Api

  app.post('/api/logout', authMiddleware, (req, res) => {
     // Add the token to the blacklist
     blacklist.push(req.headers['authorization']);
    // For simplicity, let's just respond with a success message
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = app