// Map: roomId → { timeLeft, duration, isRunning, mode, timerInterval }
const roomTimers = new Map();

const setupTimerHandler = (socket, io) => {
  const getTimerState = (roomId) => {
    const timer = roomTimers.get(roomId);
    if (!timer) {
      return {
        timeLeft: 1500, // 25 minutes default
        duration: 1500,
        isRunning: false,
        mode: 'work',
      };
    }
    return {
      timeLeft: timer.timeLeft,
      duration: timer.duration,
      isRunning: timer.isRunning,
      mode: timer.mode,
    };
  };

  // Sync state on user request
  socket.on('get-timer-state', ({ roomId }) => {
    if (!roomId) return;
    socket.emit('timer-update', getTimerState(roomId));
  });

  // Start timer
  socket.on('start-timer', ({ roomId }) => {
    if (!roomId) return;

    let timer = roomTimers.get(roomId);
    if (!timer) {
      timer = {
        timeLeft: 1500,
        duration: 1500,
        isRunning: false,
        mode: 'work',
        timerInterval: null,
      };
      roomTimers.set(roomId, timer);
    }

    if (timer.isRunning) return;

    timer.isRunning = true;

    // Broadcast immediate start state
    io.to(roomId).emit('timer-update', {
      timeLeft: timer.timeLeft,
      duration: timer.duration,
      isRunning: true,
      mode: timer.mode,
    });

    // Start interval
    timer.timerInterval = setInterval(() => {
      timer.timeLeft--;

      if (timer.timeLeft <= 0) {
        // Toggle mode
        if (timer.mode === 'work') {
          timer.mode = 'break';
          timer.duration = 300; // 5 minutes break
          timer.timeLeft = 300;
        } else {
          timer.mode = 'work';
          timer.duration = 1500; // 25 minutes work
          timer.timeLeft = 1500;
        }
        io.to(roomId).emit('timer-cycle-complete', { mode: timer.mode });
      }

      io.to(roomId).emit('timer-update', {
        timeLeft: timer.timeLeft,
        duration: timer.duration,
        isRunning: timer.isRunning,
        mode: timer.mode,
      });
    }, 1000);

    console.log(`⏱️ Timer started in room ${roomId}`);
  });

  // Pause timer
  socket.on('pause-timer', ({ roomId }) => {
    if (!roomId) return;
    const timer = roomTimers.get(roomId);
    if (!timer || !timer.isRunning) return;

    timer.isRunning = false;
    if (timer.timerInterval) {
      clearInterval(timer.timerInterval);
      timer.timerInterval = null;
    }

    io.to(roomId).emit('timer-update', {
      timeLeft: timer.timeLeft,
      duration: timer.duration,
      isRunning: false,
      mode: timer.mode,
    });

    console.log(`⏱️ Timer paused in room ${roomId}`);
  });

  // Reset timer
  socket.on('reset-timer', ({ roomId }) => {
    if (!roomId) return;
    const timer = roomTimers.get(roomId);

    if (timer) {
      timer.isRunning = false;
      timer.mode = 'work';
      timer.duration = 1500;
      timer.timeLeft = 1500;
      if (timer.timerInterval) {
        clearInterval(timer.timerInterval);
        timer.timerInterval = null;
      }
    }

    io.to(roomId).emit('timer-update', {
      timeLeft: 1500,
      duration: 1500,
      isRunning: false,
      mode: 'work',
    });

    console.log(`⏱️ Timer reset in room ${roomId}`);
  });
};

module.exports = setupTimerHandler;
