const { workerData, move } = require('piscina');
const { dbpath: filename } = workerData;
const { decodeRequest, encodeResponse } = require('./codec');

const QueryService = require('pelias-spatial/service/QueryService.js');
const spatial = require('pelias-spatial/server/routes/pip_pelias.js');

console.error(`Worker: opening spatial database ${filename}`);
const service = new QueryService({ readonly: true, filename });

module.exports = async function lookup({ encodedRequest }) {
  const { centroid } = decodeRequest(encodedRequest);

  const req = {
    app: { locals: { service } },
    params: centroid,
    query: { layers: '' }
  };

  return new Promise((resolve, reject) => {
    const res = {
      status: (_code) => res,
      json: (result) => resolve(move(encodeResponse(result)))
    };

    try {
      spatial(req, res);
    } catch (error) {
      reject(error);
    }
  });
};
