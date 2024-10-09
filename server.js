// server.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  addresses: [String],
});

const User = mongoose.model('User', UserSchema);

// Restaurant Schema
const RestaurantSchema = new mongoose.Schema({
  name: String,
  location: String,
  menu: [
    {
      name: String,
      description: String,
      price: Number,
      available: Boolean,
    },
  ],
});

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  userId: String,
  restaurantId: String,
  items: [String],
  totalCost: Number,
  status: { type: String, enum: ['Pending', 'Confirmed', 'In Progress', 'Out for Delivery', 'Delivered'], default: 'Pending' },
  deliveryAddress: String,
});

const Order = mongoose.model('Order', OrderSchema);

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// JWT middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).send('Access Denied');
  
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid Token');
  }
};

// Routes

// User Registration
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();
  res.send('User registered successfully');
});

// User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).send('Invalid credentials');
  }

  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  res.header('Authorization', `Bearer ${token}`).send('Logged in');
});

// User Profile
app.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.send(user);
});

// Update User Profile
app.put('/profile', auth, async (req, res) => {
  const { name, email, addresses } = req.body;
  await User.findByIdAndUpdate(req.user._id, { name, email, addresses });
  res.send('Profile updated');
});

// Create Restaurant
app.post('/restaurants', async (req, res) => {
  const { name, location, menu } = req.body;

  const newRestaurant = new Restaurant({ name, location, menu });
  await newRestaurant.save();
  res.send('Restaurant created successfully');
});

// Update Restaurant
app.put('/restaurants/:restaurantId', async (req, res) => {
  const { name, location } = req.body;
  await Restaurant.findByIdAndUpdate(req.params.restaurantId, { name, location });
  res.send('Restaurant updated successfully');
});

// Add Menu Item
app.post('/restaurants/:restaurantId/menu', async (req, res) => {
  const { name, description, price, available } = req.body;
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  restaurant.menu.push({ name, description, price, available });
  await restaurant.save();
  res.send('Menu item added');
});

// Place Order
app.post('/orders', auth, async (req, res) => {
  const { restaurantId, items, deliveryAddress } = req.body;
  const restaurant = await Restaurant.findById(restaurantId);
  const totalCost = items.reduce((sum, itemName) => {
    const item = restaurant.menu.find(item => item.name === itemName);
    return sum + (item ? item.price : 0);
  }, 0);

  const newOrder = new Order({
    userId: req.user._id,
    restaurantId,
    items,
    totalCost,
    deliveryAddress,
  });

  await newOrder.save();
  res.send('Order placed successfully');

  // Notify via WebSocket (real-time tracking)
  io.emit('order-status-update', { orderId: newOrder._id, status: newOrder.status });
});

// Get Orders
app.get('/orders', auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id });
  res.send(orders);
});

// Update Order Status
app.put('/orders/:orderId/status', async (req, res) => {
  const { status } = req.body;
  await Order.findByIdAndUpdate(req.params.orderId, { status });
  res.send('Order status updated');

  // Notify via WebSocket
  io.emit('order-status-update', { orderId: req.params.orderId, status });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
