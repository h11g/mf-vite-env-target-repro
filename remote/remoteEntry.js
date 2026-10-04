// Minimal hand-written container, in the shape the Node script loader expects.
module.exports = {
  init() {},
  get(expose) {
    if (expose !== './hello') throw new Error(`unknown expose ${expose}`);
    return () => ({ default: 'hello from widget' });
  },
};
