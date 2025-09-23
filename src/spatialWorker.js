const { workerData } = require('piscina');
const { dbpath: filename } = workerData;

const QueryService = require('pelias-spatial/service/QueryService.js');
const spatial = require('pelias-spatial/server/routes/pip_pelias.js');

console.error(`Worker: opening spatial database ${filename}`);
const service = new QueryService({ readonly: true, filename });

module.exports = async function lookup({ centroid }) {
  const req = {
    app: { locals: { service } },
    params: centroid,
    query: { layers: '' }
  };

  return new Promise((resolve, reject) => {
    const res = {
      status: (_code) => res,
      json: (result) => resolve(result)
    };

    try {
      spatial(req, res);
    } catch (error) {
      reject(error);
    }
  });
};
