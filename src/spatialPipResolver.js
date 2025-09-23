const path = require('path');
const cpus = require('os').cpus().length;
const { Piscina, FixedQueue } = require('piscina');

class SpatialPipService {
  constructor (datapath) {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, 'spatialWorker.js'),
      workerData: {
        dbpath: path.resolve(datapath, '..', 'spatial', 'whosonfirst-data-admin-us-latest.spatial.db')
      },
      minThreads: cpus -1,
      maxThreads: cpus -1,
      idleTimeout: Infinity,
      maxQueue: cpus * 5,
      taskQueue: new FixedQueue()
    });
  }

  lookup(centroid, _search_layers, cb) {
    this.pool.run({ centroid })
      .then(result => cb(null, result))
      .catch(error => cb(error));
  }

  end() {
    this.pool.close();
  }
}

module.exports = (datapath, layers) => {
  return new SpatialPipService(datapath, layers);
};