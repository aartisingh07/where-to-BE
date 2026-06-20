const express = require('express');
const router = express.Router();
const { createPlan, getMyPlans } = require('../controllers/outingPlanController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createPlan);
router.get('/my-plans', protect, getMyPlans);

module.exports = router;
