const path = require('node:path');
const { Worker } = require('worker_threads');
const os = require('os');

class SpatialPipService {
  constructor (datapath, layers, options = {}) {
    this.datapath = datapath;
    this.layers = layers;
    this.workers = [];
    this.currentWorker = 0;
    this.messageId = 0;
    this.pendingRequests = new Map();
    
    const numWorkers = options.numWorkers || os.cpus().length -1;
    console.error(`Initializing ${numWorkers} spatial workers`);
    
    for (let i = 0; i < numWorkers; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    const worker = new Worker(path.join(__dirname, 'spatialWorker.js'), {
      workerData: { datapath: this.datapath }
    });
    
    worker.on('message', (message) => {
      const { id, type, data } = message;
      const pendingRequest = this.pendingRequests.get(id);
      
      if (pendingRequest) {
        this.pendingRequests.delete(id);
        
        if (type === 'result') {
          pendingRequest.callback(null, data);
        } else if (type === 'error') {
          const error = new Error(data.message);
          error.stack = data.stack;
          pendingRequest.callback(error);
        }
      }
    });
    
    worker.on('error', (error) => {
      console.error('Worker error:', error);
    });
    
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
    
    this.workers.push(worker);
  }

  getNextWorker() {
    const worker = this.workers[this.currentWorker];
    this.currentWorker = (this.currentWorker + 1) % this.workers.length;
    return worker;
  }

  lookup(centroid, search_layers, callback) {
    try {
      const messageId = ++this.messageId;
      this.pendingRequests.set(messageId, { callback });
      
      const worker = this.getNextWorker();
      worker.postMessage({
        id: messageId,
        type: 'lookup',
        data: {
          centroid,
          // search_layers
        }
      });
    } catch (error) {
      console.error('Lookup error:', error);
      callback(error);
    }
  }

  end() {
    console.error('Terminating spatial workers');
    
    this.workers.forEach(worker => {
      worker.postMessage({ type: 'close' });
      worker.terminate();
    });
    
    this.workers = [];
    this.pendingRequests.clear();
  }
}

module.exports = (datapath, layers) => {
  return new SpatialPipService(datapath, layers);
};