// poor man's deep clone..
const clone = (obj) => {
  obj = typeof obj !== 'undefined' ? obj : '';
  return JSON.parse(JSON.stringify(obj));
};

module.exports = { clone };
