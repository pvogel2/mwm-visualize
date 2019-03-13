const { Base } = require('./base.js');

class Indicators extends Base {
  constructor(collection) {
    super(collection);
  }

  setQuery(o) {
    const q = {};
    if (o.indicator) {
      q.id = o.indicator;
    }

    o.query = q;
  }

  getRequestOptions(o) {
    return {
      method: 'GET',
      hostname: this.hostname,
      path: `/v2/indicators/${o.indicator}?format=json`
    };
  }
};

module.exports.Indicators = Indicators;