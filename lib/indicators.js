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
    const ph = super.getRequestOptions(o);
    Object.assign(ph, {
      path: `${ph.path}/indicators/${o.indicator}?format=json`
    });

    return ph;
  }
};

module.exports.Indicators = Indicators;