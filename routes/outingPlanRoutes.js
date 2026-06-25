const express = require('express');
const router = express.Router();
const { createPlan, getMyPlans, getPlanForRoom, deletePlan } = require('../controllers/outingPlanController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createPlan);
router.get('/my-plans', protect, getMyPlans);
router.get('/room/:roomId', protect, getPlanForRoom);
router.delete('/:id', protect, deletePlan);

module.exports = router;

