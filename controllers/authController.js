const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User,Admin } = require('../models'); // Adjust path as per your project structure
const SECRET_KEY = 'your_jwt_secret_key';

exports.register = async (req, res) => {
  // Registration logic

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
};

exports.login = async (req, res) => {
  // Login logic

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
};

exports.admin_login = async (req, res) => {

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
};
