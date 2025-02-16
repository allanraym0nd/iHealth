const User = require('../models/User');
const Patient = require('../models/Patient'); // Add this import
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const register = async (req, res, next) => {
  try {
    const { 
      username, 
      password, 
      role,
      name,
      age,
      gender,
      phone,
      email 
    } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new AppError('Username already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      password: hashedPassword,
      role
    });

    await user.save();

    // If role is patient, create patient profile
    if (role === 'patient') {
      const patient = new Patient({
        userId: user._id,
        name,
        age,
        gender,
        contact: {
          phone,
          email
        },
        status: 'active'
      });

      await patient.save();
    }

    // Generate token for instant login
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      status: 'success',
      message: 'User registered successfully',
      token,
      role: user.role
    });
  } catch (error) {
    next(error); // Pass error to error handler
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
   // console.log("Username:", username);
    // console.log("Password:", password);

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response with flattened structure
    res.json({
      token,
      role: user.role
    });
  } catch (error) {
   // console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

module.exports = { register, login };