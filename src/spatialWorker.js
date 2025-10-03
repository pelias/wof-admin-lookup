const QueryService = require('pelias-spatial/service/QueryService.js');
const spatial = require('pelias-spatial/server/routes/pip_pelias.js');
const service = new QueryService({ readonly: true, pelias: true });

module.exports = function lookup({ centroid }) {
  return spatial.query(service, centroid);
};
