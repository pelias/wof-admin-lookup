const tape = require('tape');
const proxyquire = require('proxyquire').noCallThru();

// run() is called with each batch, and resolves with the result of `respond`
const defaults = { maxBatchSize: 16, batchesPerWorker: 4 };

function createResolver(config, respond) {
  let options;
  const batches = [];
  const resolver = proxyquire('../src/spatialPipResolver', {
    piscina: {
      Piscina: class {
        constructor(opts) { options = opts; }
        run(batch) {
          batches.push(batch);
          return respond ? respond(batch) : Promise.resolve(batch.map(item => ({ lat: item.centroid.lat })));
        }
      }
    }
  })({ ...defaults, ...config });
  return { resolver, options, batches };
}

tape('spatialPipResolver tests', (test) => {
  test.test('pool size should be taken from workerThreads config', (t) => {
    const { options } = createResolver({ workerThreads: 3 });
    t.equals(options.minThreads, 3);
    t.equals(options.maxThreads, 3);
    t.end();
  });

  test.test('batch size should allow two batches in flight per worker, between 1 and 16', (t) => {
    t.equals(createResolver({ workerThreads: 7, maxConcurrentReqs: 80 }).resolver.batchSize, 5);
    t.equals(createResolver({ workerThreads: 16, maxConcurrentReqs: 960 }).resolver.batchSize, 16);
    t.equals(createResolver({ workerThreads: 8, maxConcurrentReqs: 10 }).resolver.batchSize, 1);
    t.equals(createResolver({ workerThreads: 8 }).resolver.batchSize, 1);
    t.end();
  });

  test.test('batch size should be capped by maxBatchSize config', (t) => {
    t.equals(createResolver({ workerThreads: 16, maxConcurrentReqs: 960, maxBatchSize: 8 }).resolver.batchSize, 8);
    t.end();
  });

  test.test('batchesPerWorker config should set concurrent tasks per worker', (t) => {
    t.equals(createResolver({ workerThreads: 1 }).options.concurrentTasksPerWorker, 4);
    t.equals(createResolver({ workerThreads: 1, batchesPerWorker: 2 }).options.concurrentTasksPerWorker, 2);
    t.end();
  });

  test.test('a full batch should be sent immediately', (t) => {
    const { resolver, batches } = createResolver({ workerThreads: 1, maxConcurrentReqs: 4 });
    t.equals(resolver.batchSize, 2);
    resolver.lookup({ lat: 1, lon: 1 }, ['locality'], () => {});
    t.equals(batches.length, 0);
    resolver.lookup({ lat: 2, lon: 2 }, undefined, () => {});
    t.deepEquals(batches, [[
      { centroid: { lat: 1, lon: 1 }, layers: ['locality'] },
      { centroid: { lat: 2, lon: 2 } }
    ]]);
    t.end();
  });

  test.test('a partial batch should be sent once the event loop is idle', (t) => {
    const { resolver, batches } = createResolver({ workerThreads: 1, maxConcurrentReqs: 20 });
    const results = [];
    resolver.lookup({ lat: 1, lon: 1 }, undefined, (err, res) => results.push([err, res]));
    resolver.lookup({ lat: 2, lon: 2 }, undefined, (err, res) => results.push([err, res]));
    t.equals(batches.length, 0);
    setImmediate(() => {
      t.equals(batches.length, 1);
      t.equals(batches[0].length, 2);
      setImmediate(() => {
        t.deepEquals(results, [[null, { lat: 1 }], [null, { lat: 2 }]]);
        t.end();
      });
    });
  });

  test.test('an error result should only be passed to the lookup that caused it', (t) => {
    const { resolver } = createResolver({ workerThreads: 1, maxConcurrentReqs: 4 }, () => {
      return Promise.resolve([new Error('query failed'), { lat: 2 }]);
    });
    const results = [];
    const done = () => {
      if (results.length < 2) { return; }
      t.equals(results[0][0].message, 'query failed');
      t.deepEquals(results[1], [null, { lat: 2 }]);
      t.end();
    };
    resolver.lookup({ lat: 1, lon: 1 }, undefined, (err, res) => { results.push([err, res]); done(); });
    resolver.lookup({ lat: 2, lon: 2 }, undefined, (err, res) => { results.push([err, res]); done(); });
  });

  test.test('a failed batch should pass the error to every lookup in it', (t) => {
    const { resolver } = createResolver({ workerThreads: 1, maxConcurrentReqs: 4 }, () => {
      return Promise.reject(new Error('worker failed'));
    });
    const errors = [];
    const done = (err) => {
      errors.push(err.message);
      if (errors.length < 2) { return; }
      t.deepEquals(errors, ['worker failed', 'worker failed']);
      t.end();
    };
    resolver.lookup({ lat: 1, lon: 1 }, undefined, done);
    resolver.lookup({ lat: 2, lon: 2 }, undefined, done);
  });
});
