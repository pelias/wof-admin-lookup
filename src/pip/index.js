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

// don't include `country` here, it makes the bookkeeping more difficult later
var defaultLayers = module.exports.defaultLayers = [
  'borough', // 5
  'county', // 18166
  'dependency', // 39
  'localadmin', // 106880
  'locality', // 160372
  'macrocounty', // 350
  'macroregion', // 82
  'neighbourhood', // 62936
  'region' // 4698
];

module.exports.create = function createPIPService(datapath, layers, localizedAdminNames, callback) {
  if (_.isEmpty(layers)) {
    layers = defaultLayers;
  }

  // load all workers, including country, which is a special case
  async.forEach(layers.concat('country'), function (layer, done) {
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
          } else if (_.isEqual(search_layers, ['country']) && workers.country) {
            // in the case where only the country layer is to be searched
            // (and the country layer is loaded), keep search_layers unmodified
            // so that the country layer is queried directly
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
            responseCallback: responseCallback,
            countryLayerHasBeenCalled: false,
            lookupCountryByIdHasBeenCalled: false
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

  // all layers have been called, so process the results, potentially calling
  //  the country layer or looking up country by id
  if (countryLayerShouldBeCalled(responseQueue[msg.id], workers)) {
      // mark that countryLayerHasBeenCalled so it's not called again
      responseQueue[msg.id].countryLayerHasBeenCalled = true;

      searchWorker(msg.id, workers.country, responseQueue[msg.id].latLon);
  } else if (lookupCountryByIdShouldBeCalled(responseQueue[msg.id])) {
      // mark that lookupCountryById has already been called so it's not
      //  called again if it returns nothing
      responseQueue[msg.id].lookupCountryByIdHasBeenCalled = true;

      lookupCountryById(msg.id, getId(responseQueue[msg.id].results));
  } else {
    // all info has been gathered, so return
    responseQueue[msg.id].responseCallback(null, responseQueue[msg.id].results);
    delete responseQueue[msg.id];
  }
}

// helper function that gets the id of the first result with a hierarchy country id
// caveat:  this will produce inconsistent behavior if results have different
//  hierarchy country id values (which shouldn't happen, otherwise it's bad data)
//
// it's safe to assume that at least one result has a hierarchy country id value
//  since the call to `lookupCountryByIdShouldBeCalled` has already confirmed it
//  and this function is called in combination
function getId(results) {
  for (var i = 0; i < results.length; i++) {
    for (var j = 0; j < results[i].Hierarchy.length; j++) {
      if (results[i].Hierarchy[j].hasOwnProperty('country_id')) {
        return results[i].Hierarchy[j].country_id;
      }
    }
  }
}

// helper function to determine if country should be looked up by id
// returns `false` if:
// 1.  there are no results (lat/lon is in the middle of an ocean)
// 2.  no result has a hierarchy country id (shouldn't happen but guard against bad data)
// 3.  lookupCountryByIdHasBeenCalled has already been called
// 4.  there is already a result with a `country` Placetype
//
// in the general case, this function should return true because the country
// polygon lookup is normally skipped for performance reasons but country needs
// to be looked up anyway
function lookupCountryByIdShouldBeCalled(q) {
  // helper that returns true if at least one Hierarchy of a result has a `country_id` property
  var hasCountryId = function(result) {
    return _.some(result.Hierarchy, (h) => { return h.hasOwnProperty('country_id');});
  };

  // don't call if no (or any) result has a country id
  if (!_.some(q.results, hasCountryId)) {
    return false;
  }

  // don't call lookupCountryById if it's already been called
  if (q.lookupCountryByIdHasBeenCalled) {
    return false;
  }

  // return true if there are no results with 'country' Placetype
  return !_.some(q.results, (result) => { return result.Placetype === 'country'; } );

}

// helper to determine if all requested layers have been called
// need to check `>=` since country is initially excluded but counted when the worker returns
function allLayersHaveBeenCalled(q) {
  return q.numberOfLayersCalled >= q.search_layers.length;
}

// country layer should be called when the following 3 conditions have been met
// 1. no other layers returned anything (when a point falls under no subcountry polygons)
// 2. country layer has not already been called
// 3. there is a country layer available (don't crash if it hasn't been loaded)
function countryLayerShouldBeCalled(q, workers) {
  return q.results.length === 0 && // no non-country layers returned anything
          !q.countryLayerHasBeenCalled &&
          workers.hasOwnProperty('country');
}
