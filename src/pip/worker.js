'use strict';

/**
 * A worker processes intended to be launched by the `./index.js` module.
 * Loads one polygon layer into memory, builds a `PolygonLookup` for it, and
 * then returns intersection results for `search` queries.
 */

const logger = require( 'pelias-logger').get('admin-lookup:worker');
const PolygonLookup = require('polygon-lookup');

const readStream = require('./readStream');
const fs = require('fs');
const path = require('path');

const layer = process.title = process.argv[2];
const datapath = process.argv[3];
const localizedAdminNames = process.argv[4];
const startTime = Date.now();

const results = {
  calls: 0,
  hits: 0,
  misses: 0
};

let adminLookup;

process.on('SIGTERM', () => {
  logger.info(`${layer} worker process exiting, stats: ${JSON.stringify(results)}`);
  process.exit(0);
});

readStream(datapath, layer, localizedAdminNames, (features) => {
  // find all the properties of all features and write them to a file
  // at the same time, limit the feature.properties to just Id and Hierarchy since it's all that's needed in the worker
  const data = features.reduce((acc, feature) => {
    acc[feature.properties.Id] = feature.properties;
    feature.properties = {
      Id: feature.properties.Id,
      Hierarchy: feature.properties.Hierarchy
    };
    return acc;
  }, {});

  adminLookup = new PolygonLookup( { features: features } );

  process.on('message', msg => {
    switch (msg.type) {
      case 'search' : return handleSearch(msg);
      default       : logger.error('Unknown message:', msg);
    }
  });

  // alert the master thread that this worker has been loaded and is ready for requests
  process.send( {
    type: 'loaded',
    layer: layer,
    data: data,
    seconds: ((Date.now() - startTime)/1000)
  });
});

function handleSearch(msg) {
  process.send({
    type: 'results',
    layer: layer,
    id: msg.id,
    results: search( msg.coords )
  });
}

/**
 * Search `adminLookup` for `latLon`.
 */
function search( latLon ){
  const poly = adminLookup.search( latLon.longitude, latLon.latitude );

  results.calls++;
  if (poly) {
    results.hits++;
  } else {
    results.misses++;
  }

  return (poly === undefined) ? {} : poly.properties;
}
