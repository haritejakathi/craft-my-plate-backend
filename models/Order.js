const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  items: [{ name: String, price: Number, quantity: Number }],
  deliveryAddress: String,
  totalPrice: Number,
  status: { type: String, default: 'Pending' },
  estimatedDeliveryTime: Date,
});
module.exports = mongoose.model('Order', orderSchema);
