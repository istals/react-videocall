/* eslint-disable no-await-in-loop */

const robots = {};
let lastRobotId = 0;


// Random ID until the ID is not in use
async function robotID() {
  const id = lastRobotId + 1;
  lastRobotId = id;
  return `robot-${id}`;
}



exports.create = async (socket) => {
  const id = await robotID();
  robots[id] = socket;
  return id;
};
exports.get = (id) => robots[id];
exports.remove = (id) => {
  delete robots[id];
};
exports.list = () => {
  return Object.keys(robots);
};
