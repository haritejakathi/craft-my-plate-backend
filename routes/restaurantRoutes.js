const express = require('express');
const router = express.Router();
const { createRestaurant, addMenuItem } = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createRestaurant);
router.post('/:restaurantId/menu', authMiddleware, addMenuItem);

module.exports = router;
