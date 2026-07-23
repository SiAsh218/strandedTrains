let io;

const initialise = (socketServer) => {
  io = socketServer;
};

const getIo = () => {
  return io;
};

module.exports = {
  initialise,
  getIo,
};
