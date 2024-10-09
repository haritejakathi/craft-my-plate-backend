const mongoose = require('mongoose');
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  menu: [{
    name: String,
    description: String,
    price: Number,
    available: { type: Boolean, default: true },
  }],
});
module.exports = mongoose.model('Restaurant', restaurantSchema);
