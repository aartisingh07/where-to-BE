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

const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await OutingPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Outing plan not found' });
    }

    if (plan.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator of the outing plan can cancel it' });
    }

    await OutingPlan.findByIdAndDelete(id);

    const Notification = require('../models/Notification');

    const otherMembers = plan.members.filter(
      (memberId) => memberId.toString() !== req.user.id
    );

    const io = req.app.get('io');

    if (otherMembers.length > 0) {
      const notifications = otherMembers.map((memberId) => ({
        user: memberId,
        title: '🚨 Outing Plan Cancelled',
        message: `${req.user.username} has cancelled the outing plan for "${plan.placeName}" scheduled on ${new Date(plan.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
        type: 'info',
      }));

      const savedNotifs = await Notification.insertMany(notifications);

      if (io) {
        savedNotifs.forEach((notif) => {
          io.emit(`notification-${notif.user.toString()}`, {
            _id: notif._id,
            user: notif.user,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            isRead: notif.isRead,
            createdAt: notif.createdAt,
          });
        });
      }
    }

    if (io) {
      io.to(plan.roomId.toString()).emit('outing-plan-cancelled');
    }

    res.json({ message: 'Outing plan cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPlan, getMyPlans, getPlanForRoom, deletePlan };

