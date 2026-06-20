const OutingPlan = require('../models/OutingPlan');
const Notification = require('../models/Notification');

const checkReminders = async (io) => {
  try {
    const now = new Date();
    // 24 hours from now
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find upcoming outing plans that are within the next 24 hours and haven't triggered a reminder
    const plans = await OutingPlan.find({
      dateTime: { $gte: now, $lte: targetTime },
      reminderSent: { $ne: true }
    });

    for (const plan of plans) {
      // Create notification records for all members
      const notifications = plan.members.map(memberId => ({
        user: memberId,
        title: '📅 Hangout Reminder!',
        message: `Friendly reminder: You have a scheduled meetup at "${plan.placeName}" on ${new Date(plan.dateTime).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}!`,
        type: 'reminder'
      }));

      // Mark as sent
      plan.reminderSent = true;
      await plan.save();

      if (notifications.length > 0) {
        const savedNotifs = await Notification.insertMany(notifications);
        
        // Emit real-time notification socket event to each member with MongoDB ID
        if (io) {
          savedNotifs.forEach(notif => {
            io.emit(`notification-${notif.user.toString()}`, {
              _id: notif._id,
              user: notif.user,
              title: notif.title,
              message: notif.message,
              type: notif.type,
              isRead: notif.isRead,
              createdAt: notif.createdAt
            });
          });
        }
      }
    }
  } catch (error) {
    console.error('Error running background reminder check:', error);
  }
};

const startReminderScheduler = (io) => {
  // Check every 2 minutes
  setInterval(() => {
    checkReminders(io);
  }, 2 * 60 * 1000);
  
  // Also run immediately on startup
  checkReminders(io);
};

module.exports = startReminderScheduler;
