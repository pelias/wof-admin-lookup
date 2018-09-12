/**
 * @file In order to load huge volumes of polygon data into memory without
 * breaking Node (due to its low heap-size limits), the package forks a
 * worker process per polygon layer/shapefile. This module contains
 * functions for initializing them and searching them.
 */

'use strict';

const path = require('path');
const childProcess = require( 'child_process' );
const logger = require( 'pelias-logger' ).get( 'wof-pip-service:master' );
const async = require('async');
const _ = require('lodash');
const fs = require('fs');
const missingMetafilesAreFatal = require('pelias-config').generate(require('../../schema')).imports.adminLookup.missingMetafilesAreFatal;

let requestCount = 0;
// worker processes keyed on layer
const workers = {};

const responseQueue = {};
const wofData = {};

const defaultLayers = [
  'neighbourhood',
  'borough',
  'locality',
  'localadmin',
  'county',
  'macrocounty',
  'macroregion',
  'region',
  'dependency',
  'country',
  'empire',
  'continent',
  'marinearea',
  'ocean'
];

module.exports.create = function createPIPService(datapath, layers, localizedAdminNames, callback) {
  // take the intersection to keep order in decreasing granularity
  // ie - _.intersection([1, 2, 3], [3, 1]) === [1, 3]
  layers = _.intersection(defaultLayers, _.isEmpty(layers) ? defaultLayers : layers);

  // keep track of any missing metafiles for later reporting and error conditions
  const missingMetafiles = [];

  // further refine the layers by filtering out layers for which there is no metafile
  layers = layers.filter(layer => {
    const filename = path.join(datapath, 'meta', `whosonfirst-data-${layer}-latest.csv`);

    if (!fs.existsSync(filename)) {
      const message = `unable to locate ${filename}`;
      if (missingMetafilesAreFatal) {
        logger.error(message);
      } else {
        logger.warn(message);
      }
      missingMetafiles.push(`whosonfirst-data-${layer}-latest.csv`);
      return false;
    }
    return true;
  });

  // if there are missing metafiles and this is fatal, then return an error
  if (!_.isEmpty(missingMetafiles) && missingMetafilesAreFatal) {
    return callback(`unable to locate meta files in ${path.join(datapath, 'meta')}: ${missingMetafiles.join(', ')}`);
  }

  logger.info(`starting with layers ${layers}`);

  // load all workers
  async.forEach(layers, (layer, done) => {
      startWorker(datapath, layer, localizedAdminNames, function (err, worker) {
        done();
      });
    },
    function end() {
      logger.info('PIP Service Loading Completed!!!');

      callback(null, {
        end: killAllWorkers,
        lookup: function (latitude, longitude, search_layers, responseCallback) {
          if (search_layers === undefined) {
            search_layers = layers;
          } else {
            // take the intersection of the valid layers and the layers sent in
            // so that if any layers are manually disabled for development
            // everything still works. this also means invalid layers
            // are silently ignored
            search_layers = _.intersection(layers, search_layers);
          }

          if (search_layers.length === 0) {
            return responseCallback(null, []);
          }

          const id = requestCount++;

          if (responseQueue.hasOwnProperty(id)) {
            const msg = `Tried to create responseQueue item with id ${id} that is already present`;
            logger.error(msg);
            return responseCallback(null, []);
          }

          // bookkeeping object that tracks the progress of the request
          responseQueue[id] = {
            latLon: {latitude: latitude, longitude: longitude},
            // copy of layers to search
            search_layers: search_layers.slice(),
            responseCallback: responseCallback
          };

          // start the chain of worker calls
          searchWorker(id);

        }
      });
    }
  );
};

function killAllWorkers() {
  _.values(workers).forEach(worker => worker.kill());
}

function startWorker(datapath, layer, localizedAdminNames, callback) {
  const worker = childProcess.fork(path.join(__dirname, 'worker'), [layer, datapath, localizedAdminNames]);
  workers[layer] = worker;

  worker.on('message', msg => {
    if (msg.type === 'loaded') {
      logger.info(`${msg.layer} worker loaded ${_.size(msg.data)} features in ${msg.seconds} seconds`);

      // add all layer-specific WOF data to the big WOF data
      _.assign(wofData, msg.data);
      callback(null, worker);
    } else if (msg.type === 'results') {
      // a worker responded with results, so process
      handleResults(msg);
    }

  });

  worker.on('exit', (code, signal)  => {
    // the `.killed` property will be true if a kill signal was previously sent to this worker
    // in that case, the worker shutting down is not an error
    // if the worker _was not_ told to shut down, it's a big problem
    if (!worker.killed) {
      logger.error(`${layer} worker exited unexpectedly with code ${code}, signal ${signal}`);
      killAllWorkers();

      // throw after a slight delay so that the exception message is the last thing on the screen
      setTimeout(() => {
        throw `${layer} worker shutdown unexpectedly`;
      }, 300);
    }
  });

  // a worker emitting the `error` event is always bad
  worker.on('error', (err)  => {
    killAllWorkers();

    // throw after a slight delay so that the exception message is the last thing on the screen
    setTimeout(() => {
      throw `${layer} worker connection errored: ${err}`;
    }, 300);
  });
}

function searchWorker(id) {
  const worker = workers[responseQueue[id].search_layers.shift()];

  worker.send({
    type: 'search',
    id: id,
    coords: responseQueue[id].latLon
  });
}

function handleResults(msg) {
  if (!responseQueue.hasOwnProperty(msg.id)) {
    logger.error(`tried to handle results for missing id ${msg.id}`);
    return;
  }

  // first, handle the case where there was a miss
  if (_.isEmpty(msg.results)) {
    if (!_.isEmpty(responseQueue[msg.id].search_layers)) {
      // if there are no results, then call the next layer but only if there are more layer to call
      searchWorker(msg.id);
    } else {
      // no layers left to search, so return an empty array
      responseQueue[msg.id].responseCallback(null, []);

      delete responseQueue[msg.id];
    }

  } else {
    // there was a hit, so find the hierachy and assemble all the pieces
    const results = _.compact(msg.results.Hierarchy[0].map(id => wofData[id]));

    responseQueue[msg.id].responseCallback(null, results);

    delete responseQueue[msg.id];
  }

}
