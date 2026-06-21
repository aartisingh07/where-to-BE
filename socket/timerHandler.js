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
        workDuration: 1500,
        breakDuration: 300,
      };
    }
    return {
      timeLeft: timer.timeLeft,
      duration: timer.duration,
      isRunning: timer.isRunning,
      mode: timer.mode,
      workDuration: timer.workDuration || 1500,
      breakDuration: timer.breakDuration || 300,
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
        workDuration: 1500,
        breakDuration: 300,
      };
      roomTimers.set(roomId, timer);
    }

    if (timer.isRunning) return;

    timer.isRunning = true;

    // Broadcast immediate start state
    io.to(roomId).emit('timer-update', getTimerState(roomId));

    // Start interval
    timer.timerInterval = setInterval(() => {
      timer.timeLeft--;

      if (timer.timeLeft <= 0) {
        // Toggle mode
        const workSecs = timer.workDuration || 1500;
        const breakSecs = timer.breakDuration || 300;
        if (timer.mode === 'work') {
          timer.mode = 'break';
          timer.duration = breakSecs;
          timer.timeLeft = breakSecs;
        } else {
          timer.mode = 'work';
          timer.duration = workSecs;
          timer.timeLeft = workSecs;
        }
        io.to(roomId).emit('timer-cycle-complete', { mode: timer.mode });
      }

      io.to(roomId).emit('timer-update', getTimerState(roomId));
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

    io.to(roomId).emit('timer-update', getTimerState(roomId));

    console.log(`⏱️ Timer paused in room ${roomId}`);
  });

  // Reset timer
  socket.on('reset-timer', ({ roomId }) => {
    if (!roomId) return;
    const timer = roomTimers.get(roomId);

    const workSecs = timer?.workDuration || 1500;
    const breakSecs = timer?.breakDuration || 300;

    if (timer) {
      timer.isRunning = false;
      timer.mode = 'work';
      timer.duration = workSecs;
      timer.timeLeft = workSecs;
      if (timer.timerInterval) {
        clearInterval(timer.timerInterval);
        timer.timerInterval = null;
      }
    }

    io.to(roomId).emit('timer-update', {
      timeLeft: workSecs,
      duration: workSecs,
      isRunning: false,
      mode: 'work',
      workDuration: workSecs,
      breakDuration: breakSecs,
    });

    console.log(`⏱️ Timer reset in room ${roomId}`);
  });

  // Set custom timer duration
  socket.on('set-timer-duration', ({ roomId, workDuration, breakDuration }) => {
    if (!roomId) return;

    const workSecs = parseInt(workDuration) * 60;
    const breakSecs = parseInt(breakDuration) * 60;

    if (isNaN(workSecs) || workSecs <= 0 || isNaN(breakSecs) || breakSecs <= 0) return;

    let timer = roomTimers.get(roomId);
    if (!timer) {
      timer = {
        timeLeft: workSecs,
        duration: workSecs,
        isRunning: false,
        mode: 'work',
        timerInterval: null,
        workDuration: workSecs,
        breakDuration: breakSecs,
      };
      roomTimers.set(roomId, timer);
    } else {
      timer.workDuration = workSecs;
      timer.breakDuration = breakSecs;

      // Adjust remaining time based on configuration change
      if (!timer.isRunning) {
        timer.mode = 'work';
        timer.duration = workSecs;
        timer.timeLeft = workSecs;
      } else {
        if (timer.mode === 'work') {
          timer.duration = workSecs;
          timer.timeLeft = workSecs; // Reset active work countdown to new duration
        } else {
          timer.duration = breakSecs;
          timer.timeLeft = breakSecs; // Reset active break countdown to new duration
        }
      }
    }

    io.to(roomId).emit('timer-update', getTimerState(roomId));
    console.log(`⏱️ Timer duration updated in room ${roomId}: work=${workDuration}m, break=${breakDuration}m`);
  });
};

module.exports = setupTimerHandler;
