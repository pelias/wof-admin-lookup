const { parentPort, workerData, threadId } = require('worker_threads');
const path = require('node:path');
const QueryService = require('pelias-spatial/service/QueryService.js');
const spatial = require('pelias-spatial/server/routes/pip_pelias.js');

class SpatialWorker {
  constructor(datapath) {
    const filename = path.resolve(datapath, '..', 'spatial', 'whosonfirst-data-admin-us-latest.spatial.db');
    console.error(`Worker ${threadId}: opening spatial database ${filename}`);
    
    this.service = new QueryService({
      readonly: true,
      filename
    });
  }

  lookup(centroid, search_layers) {
    return new Promise((resolve, reject) => {
      try {
        const req = {
          app: { locals: { service: this.service } },
          params: {
            lon: centroid.lon,
            lat: centroid.lat
          },
          query: {
            layers: (search_layers || []).join(',')
          }
        };

        const res = {
          status: (_code) => res,
          json: (result) => resolve(result)
        };

        spatial(req, res);
      } catch (error) {
        reject(error);
      }
    });
  }

  close() {
    if (this.service && this.service.db) {
      this.service.db.close();
    }
  }
}

let worker = null;

if (parentPort) {
  worker = new SpatialWorker(workerData.datapath);
  
  parentPort.on('message', async (message) => {
    const { id, type, data } = message;
    
    try {
      switch (type) {
        case 'lookup':
          const result = await worker.lookup(data.centroid, data.search_layers);
          parentPort.postMessage({ id, type: 'result', data: result });
          break;
          
        case 'close':
          worker.close();
          parentPort.postMessage({ id, type: 'closed' });
          process.exit(0);
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      parentPort.postMessage({ 
        id, 
        type: 'error', 
        data: { 
          message: error.message, 
          stack: error.stack 
        } 
      });
    }
  });
  
  process.on('exit', () => {
    if (worker) {
      worker.close();
    }
  });
}

module.exports = SpatialWorker;