const HTTP = require('http');

class WBRequest {
  constructor(options) {
    this.options = options;
    this.page = 0;
    this.results = [];
  }

  requestAllPages() {
    return new Promise(this.getNextPage.bind(this));
  }

  getNextPage(resolve, reject) {
    this.makeRequest()
    .then(r => {
      const meta = r.head;
      this.results = this.results.concat(r.body);

      console.log(this.page);

      if (this.page < meta.pages) {
        this.getNextPage(resolve, reject);
      } else {
        resolve(this.results);
      }
    })
    .catch(err => {
      console.log('requestAllPages', err);
      reject(err);
    });
  }

  makeRequest(options) {
    this.page++;
    const o = Object.assign({}, this.options);
    o.path += `&page=${this.page}`;

    return new Promise((resolve, reject) => {
      HTTP.get(o)
      .on('response', resp => {
        let buf = '';
        resp.on('data', chunk => buf += chunk);
        resp.on('end', () =>{
          const r = {};
          [r.head, r.body] = JSON.parse(buf);
          resolve(r);
        });
        resp.on('error', err => {
          console.log('makeRequest error');
          reject(err);
        });
      })
      .on('error',  err =>{
        reject(err);
      });
    });
  }
};

module.exports.WBRequest = WBRequest;