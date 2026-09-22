const tape = require('tape');
const proxyquire = require('proxyquire').noCallThru();

function createWorker(query) {
  return proxyquire('../src/spatialWorker', {
    'pelias-spatial/service/QueryService.js': class {},
    'pelias-spatial/server/routes/pip_pelias.js': { query }
  });
}

tape('spatialWorker tests', (test) => {
  test.test('each lookup in a batch should be passed its centroid and layers', (t) => {
    const calls = [];
    const worker = createWorker((service, centroid, layers) => {
      calls.push({ centroid, layers });
      return {};
    });
    worker([
      { centroid: { lat: 1, lon: 2 }, layers: ['locality'] },
      { centroid: { lat: 3, lon: 4 } }
    ]);
    t.deepEquals(calls, [
      { centroid: { lat: 1, lon: 2 }, layers: new Set(['locality']) },
      { centroid: { lat: 3, lon: 4 }, layers: undefined }
    ]);
    t.end();
  });

  test.test('an error should only fail the lookup that caused it', (t) => {
    const worker = createWorker((service, centroid) => {
      if (centroid.lat === 3) { throw new Error('query failed'); }
      return { locality: [] };
    });
    const results = worker([{ centroid: { lat: 1, lon: 2 } }, { centroid: { lat: 3, lon: 4 } }]);
    t.deepEquals(results[0], { locality: [] });
    t.ok(results[1] instanceof Error);
    t.equals(results[1].message, 'query failed');
    t.end();
  });
});
