const io = require('socket.io');
const users = require('./users');
const robots = require('./robots');

/**
 * Initialize when a connection is made
 * @param {SocketIO.Socket} socket
 */
function initSocket(socket, clientType, usersSocket, robotSocket) {
  let id;
  let type;
  socket
    .on('init', async () => {
      switch (clientType) {
        case 'robot':
          type = 'robot';
          id = await robots.create(socket);
          socket.emit('init', { id });
          usersSocket.emit('update_robot_list', { robots: robots.list() });
          break;
        default:
          type = 'user';
          id = await users.create(socket);
          socket.emit('init', { id, robots: robots.list() });
      }
      console.log(`${id} init `);
      console.log(robots.list());
      console.log(users.list());
    })
    .on('update_motors', (data) => {
      let receiver = null;
      console.log(`${id} update motors `, data.to);
      receiver = robots.get(data.to);
      if (receiver) {
        receiver.emit('update_motors', { from: id, protocol: data.protocol});
      }
    })
    .on('request', (data) => {
      let receiver = null;
      console.log(`${id} request `, data.to);
      switch (type) {
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
      console.log(`${id} call `, data.to);
      let receiver = null;

      switch (type) {
        case 'robot':
          receiver = users.get(data.to);
          break;
        default:
          receiver = robots.get(data.to);
      }

      if (receiver) {
        receiver.emit('call', { ...data, from: id });
      } else {
        socket.emit('end');
      }
    })
    .on('end', (data) => {
      console.log(`${id} end `, data.to);
      const receiver = users.get(data.to);
      if (receiver) {
        receiver.emit('end');
      }
    })
    .on('disconnect', () => {
      console.log(id, ' disconnected');
      switch (type) {
        case 'robot':
          usersSocket.emit('user_left', { id });
          robots.remove(id);
          break;
        default:
          robotSocket.emit('user_left', { id });
          users.remove(id);
      }
    });
}

module.exports = (server) => {
  const usersSocket = io({ path: '/bridge', serveClient: false });
  const robotSocket = io({ path: '/robot_bridge', serveClient: false });

  usersSocket
    .listen(server, { log: true })
    .on('connection', (socket) => {
      initSocket(socket, 'client', usersSocket, robotSocket);
    });

  robotSocket
    .listen(server, { log: true })
    .on('connection', (socket) => {
      initSocket(socket, 'robot', usersSocket, robotSocket);
    });
};
