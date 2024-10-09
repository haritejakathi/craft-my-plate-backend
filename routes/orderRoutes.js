const express = require('express');
const router = express.Router();
const { placeOrder, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, placeOrder);
router.put('/:orderId/status', authMiddleware, updateOrderStatus);

module.exports = router;
