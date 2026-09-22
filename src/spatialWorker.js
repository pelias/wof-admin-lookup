const QueryService = require('pelias-spatial/service/QueryService.js');
const spatial = require('pelias-spatial/server/routes/pip_pelias.js');
const service = new QueryService({ readonly: true, pelias: true });

function lookup({ centroid, layers }) {
  return spatial.query(
    service,
    centroid,
    Array.isArray(layers) ? new Set(layers) : undefined
  );
}

// each task is a batch of lookups, an error only fails the lookup that caused it
module.exports = function (batch) {
  return batch.map(item => {
    try {
      return lookup(item);
    } catch (err) {
      return err;
    }
  });
};
