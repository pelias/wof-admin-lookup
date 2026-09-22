const path = require('path');
const logger = require('pelias-logger').get('spatial-pip-resolver');
const { Piscina } = require('piscina');

class SpatialPipService {
  constructor (config) {
    const threads = config.workerThreads;

    // lookups are sent to workers in batches, to amortize the per-task cost of
    // messaging between threads. the batch size is chosen so that the number of
    // concurrent lookups allowed by the stream can keep each worker busy
    const batchSize = Math.floor((config.maxConcurrentReqs || 0) / (threads * 2));
    this.batchSize = Math.min(Math.max(batchSize, 1), config.maxBatchSize);
    this.pool = new Piscina({
      filename: path.resolve(__dirname, 'spatialWorker.js'),
      minThreads: threads,
      maxThreads: threads,
      idleTimeout: Infinity,
      concurrentTasksPerWorker: config.batchesPerWorker,
      recordTiming: false
    });
    this.batch = [];
    this.flushScheduled = false;
    logger.info(`using ${threads} worker threads, batch size ${this.batchSize}`);
  }

  lookup(centroid, layers, cb) {
    this.batch.push({ centroid, layers, cb });
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.flushScheduled) {
      this.flushScheduled = true;
      setImmediate(() => {
        this.flushScheduled = false;
        this.flush();
      });
    }
  }

  flush() {
    if (this.batch.length === 0) { return; }
    const batch = this.batch;
    this.batch = [];
    this.pool.run(batch.map(({ centroid, layers }) => layers ? { centroid, layers } : { centroid })).then(
      results => batch.forEach((item, i) => {
        const result = results[i];
        return result instanceof Error ? item.cb(result) : item.cb(null, result);
      }),
      error => batch.forEach(item => item.cb(error))
    );
  }

  end() {
    this.flush();
    this.pool.close();
  }
}

module.exports = (config) => {
  return new SpatialPipService(config);
};
