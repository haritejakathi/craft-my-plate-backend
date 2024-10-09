const Restaurant = require('../models/Restaurant');

exports.createRestaurant = async (req, res) => {
  const { name, location } = req.body;
  try {
    const restaurant = new Restaurant({ name, location });
    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.addMenuItem = async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ msg: 'Restaurant not found' });

    const menuItem = { name, description, price };
    restaurant.menu.push(menuItem);
    await restaurant.save();
    res.json(restaurant.menu);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
