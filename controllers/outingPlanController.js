const Room = require('../models/Room');
const OutingPlan = require('../models/OutingPlan');

const createPlan = async (req, res, next) => {
  try {
    const { roomId, placeName, address, lat, lng, mapsLink, dateTime } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can schedule the outing plan' });
    }

    const plan = await OutingPlan.create({
      roomId,
      roomName: room.name || `${req.user.username}'s Room`,
      placeName,
      address,
      lat,
      lng,
      mapsLink,
      dateTime,
      creator: req.user.id,
      members: room.members,
    });

    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

const getMyPlans = async (req, res, next) => {
  try {
    const plans = await OutingPlan.find({
      members: req.user.id,
      dateTime: { $gte: new Date() },
    }).sort({ dateTime: 1 });

    res.json(plans);
  } catch (error) {
    next(error);
  }
};

const getPlanForRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const plan = await OutingPlan.findOne({
      roomId,
      members: req.user.id,
      dateTime: { $gte: new Date() },
    }).sort({ dateTime: 1 });

    res.json(plan);
  } catch (error) {
    next(error);
  }
};

module.exports = { createPlan, getMyPlans, getPlanForRoom };
