const os = require('os');
const path = require('path');
const logger = require('pelias-logger').get('spatial-pip-resolver');
const { Piscina } = require('piscina');
const THREADS = os.availableParallelism() - 1;

class SpatialPipService {
  constructor () {
    this.pool = new Piscina({
      filename: path.resolve(__dirname, 'spatialWorker.js'),
      minThreads: THREADS,
      maxThreads: THREADS,
      idleTimeout: Infinity
    });
    logger.info(`using ${THREADS} worker threads`);
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
