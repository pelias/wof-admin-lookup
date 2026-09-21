const path = require('path');
const logger = require('pelias-logger').get('spatial-pip-resolver');
const { Piscina } = require('piscina');

class SpatialPipService {
  constructor (config) {
    const threads = config.workerThreads;
    this.pool = new Piscina({
      filename: path.resolve(__dirname, 'spatialWorker.js'),
      minThreads: threads,
      maxThreads: threads,
      idleTimeout: Infinity
    });
    logger.info(`using ${threads} worker threads`);
  }

  lookup(centroid, layers, cb) {
    this.pool.run(layers ? { centroid, layers } : { centroid })
      .then(result => cb(null, result))
      .catch(error => cb(error));
  }

  end() {
    this.pool.close();
  }
}

module.exports = (config) => {
  return new SpatialPipService(config);
};
