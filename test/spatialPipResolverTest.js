const tape = require('tape');
const proxyquire = require('proxyquire').noCallThru();

function createResolver(config, resolverOptions) {
  let options;
  const resolver = proxyquire('../src/spatialPipResolver', {
    piscina: {
      Piscina: class {
        constructor(opts) { options = opts; }
      }
    }
  })(config, resolverOptions);
  return { resolver, options };
}

tape('spatialPipResolver tests', (test) => {
  test.test('pool size should be taken from workerThreads config', (t) => {
    const { options } = createResolver({ workerThreads: 3 });
    t.equals(options.minThreads, 3);
    t.equals(options.maxThreads, 3);
    t.end();
  });
});
