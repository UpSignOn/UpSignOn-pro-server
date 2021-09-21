module.exports = {
  getLogDate: function () {
    return new Date().toISOString().split('.')[0];
  },
};
