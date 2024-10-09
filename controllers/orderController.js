const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

exports.placeOrder = async (req, res) => {
  const { items, deliveryAddress } = req.body;
  try {
    const restaurant = await Restaurant.findById(req.body.restaurantId);
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });

    const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const order = new Order({
      user: req.user.id,
      restaurant: req.body.restaurantId,
      items,
      deliveryAddress,
      totalPrice,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000),
    });

    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status });
    io.emit('orderStatusUpdate', { orderId: order.id, status: req.body.status });
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
