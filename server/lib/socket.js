const io = require('socket.io');
const users = require('./users');
const robots = require('./robots');

/**
 * Initialize when a connection is made
 * @param {SocketIO.Socket} socket
 */
function initSocket(socket, clientType, usersSocket) {
  let id;
  socket
    .on('init', async () => {
      switch (clientType) {
        case 'robot':
          id = await robots.create(socket);
          socket.emit('init', { id });
          usersSocket.emit('update_robot_list', { robots: robots.list() });
          break;
        default:
          id = await users.create(socket);
          socket.emit('init', { id, robots: robots.list() });
      }

      console.log(robots.list())
      console.log(users.list())
    })
    .on('request', (data) => {
      console.log('request ', data)
      let receiver = null;
      switch (data.type) {
        case 'robot':
          receiver = users.get(data.to);
          break;
        default:
          receiver = robots.get(data.to);
      }

      if (receiver) {
        receiver.emit('request', { from: id });
      }
    })
    .on('call', (data) => {
      console.log('call ', data)
      let receiver = null;
      switch (data.type) {
        case 'robot':
          receiver = robots.get(data.to);
          break;
        default:
          receiver = users.get(data.to);
      }
      if (receiver) {
        receiver.emit('call', { ...data, from: id });
      } else {
        socket.emit('end');
      }
    })
    .on('end', (data) => {
      console.log('end ', data)
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('end');
      }
    })
    .on('disconnect', () => {
      switch (clientType) {
        case 'robot':
          robots.remove(id);
          console.log(id, 'robot disconnected');
          break;
        default:
          users.remove(id);
          console.log(id, 'client disconnected');
      }
    });
}

module.exports = (server) => {
  let usersSocket = io({ path: '/bridge', serveClient: false })
    .listen(server, { log: true })
    .on('connection', (socket) => {
      initSocket(socket, 'client');
    });

  io({ path: '/robot_bridge', serveClient: false })
    .listen(server, { log: true })
    .on('connection', (socket) => {
      initSocket(socket, 'robot', usersSocket);
    });
};
