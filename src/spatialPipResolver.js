const path = require('path');
const os = require('os');
const { Piscina, FixedQueue } = require('piscina');
const THREADS = os.availableParallelism() - 1;

class SpatialPipService {
  constructor () {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, 'spatialWorker.js'),
      minThreads: THREADS,
      maxThreads: THREADS,
      idleTimeout: Infinity,
      maxQueue: THREADS * 20,
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
