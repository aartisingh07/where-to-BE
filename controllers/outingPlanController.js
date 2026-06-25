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

    // Ensure all member IDs (including host and creator) are unique ObjectIds/strings
    const memberIds = Array.from(
      new Set([
        req.user.id,
        room.host.toString(),
        ...(room.members || []).map((m) => (m._id || m).toString()),
      ])
    );

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
      members: memberIds,
    });

    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

const getMyPlans = async (req, res, next) => {
  try {
    // Show future plans and plans that started within the last 6 hours
    const bufferTime = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const plans = await OutingPlan.find({
      $or: [
        { creator: req.user.id },
        { members: req.user.id }
      ],
      dateTime: { $gte: bufferTime },
    }).sort({ dateTime: 1 });

    res.json(plans);
  } catch (error) {
    next(error);
  }
};

const getPlanForRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const bufferTime = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const plan = await OutingPlan.findOne({
      roomId,
      $or: [
        { creator: req.user.id },
        { members: req.user.id }
      ],
      dateTime: { $gte: bufferTime },
    }).sort({ dateTime: 1 });

    res.json(plan);
  } catch (error) {
    next(error);
  }
};

module.exports = { createPlan, getMyPlans, getPlanForRoom };
