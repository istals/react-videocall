import io from 'socket.io-client';

const socket = io({ path: '/robot_bridge' });

export default socket;
