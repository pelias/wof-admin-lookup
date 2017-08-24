/**
 * @file In order to load huge volumes of polygon data into memory without
 * breaking Node (due to its low heap-size limits), the package forks a
 * worker process per polygon layer/shapefile. This module contains
 * functions for initializing them and searching them.
 */

'use strict';

var path = require('path');
var childProcess = require( 'child_process' );
var logger = require( 'pelias-logger' ).get( 'wof-pip-service:master' );
var async = require('async');
var _ = require('lodash');

var requestCount = 0;
// worker processes keyed on layer
var workers = {};

var responseQueue = {};

var defaultLayers = [
  'neighbourhood',
  'borough',
  'locality',
  'localadmin',
  'county',
  'macrocounty',
  'macroregion',
  'region',
  'dependency',
  'country'
];

module.exports.create = function createPIPService(datapath, layers, localizedAdminNames, callback) {
  if (_.isEmpty(layers)) {
    layers = defaultLayers;
  }

  // load all workers
  async.forEach(function (layer, done) {
      startWorker(datapath, layer, localizedAdminNames, function (err, worker) {
        workers[layer] = worker;
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
            search_layers = _.intersection(search_layers, layers);
          }

          var id = requestCount;
          requestCount++;

          if (search_layers.length === 0) {
            return responseCallback(null, []);
          }

          if (responseQueue.hasOwnProperty(id)) {
            var msg = `Tried to create responseQueue item with id ${id} that is already present`;
            logger.error(msg);
            return responseCallback(null, []);
          }

          // bookkeeping object that tracks the progress of the request
          responseQueue[id] = {
            results: [],
            latLon: {latitude: latitude, longitude: longitude},
            search_layers: search_layers,
            numberOfLayersCalled: 0,
            responseCallback: responseCallback
          };

          search_layers.forEach(function(layer) {
            searchWorker(id, workers[layer], {latitude: latitude, longitude: longitude});
          });
        }
      });
    }
  );
};

function killAllWorkers() {
  Object.keys(workers).forEach(function (layer) {
    workers[layer].kill();
  });
}

function startWorker(datapath, layer, localizedAdminNames, callback) {
  var worker = childProcess.fork(path.join(__dirname, 'worker'));

  worker.on('message', function (msg) {
    if (msg.type === 'loaded') {
      logger.info(`${msg.layer} worker loaded ${msg.size} features in ${msg.seconds} seconds`);
      callback(null, worker);
    }

    if (msg.type === 'results') {
      handleResults(msg);
    }
  });

  worker.send({
    type: 'load',
    layer: layer,
    datapath: datapath,
    localizedAdminNames: localizedAdminNames
  });
}

function searchWorker(id, worker, coords) {
  worker.send({
    type: 'search',
    id: id,
    coords: coords
  });
}

function lookupCountryById(id, countryId) {
  workers.country.send({
    type: 'lookupById',
    id: id,
    countryId: countryId
  });
}

function handleResults(msg) {
  // logger.info('RESULTS:', JSON.stringify(msg, null, 2));

  if (!responseQueue.hasOwnProperty(msg.id)) {
    logger.error(`tried to handle results for missing id ${msg.id}`);
    return;
  }

  if (!_.isEmpty(msg.results) ) {
    responseQueue[msg.id].results.push(msg.results);
  }
  responseQueue[msg.id].numberOfLayersCalled++;

  // early exit if we're still waiting on layers to return
  if (!allLayersHaveBeenCalled(responseQueue[msg.id])) {
    return;
  }

  // all info has been gathered, so return
  responseQueue[msg.id].responseCallback(null, responseQueue[msg.id].results);
  delete responseQueue[msg.id];

}

// helper to determine if all requested layers have been called
// need to check `>=` since country is initially excluded but counted when the worker returns
function allLayersHaveBeenCalled(q) {
  return q.numberOfLayersCalled >= q.search_layers.length;
}
