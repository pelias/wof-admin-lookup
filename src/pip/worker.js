/**
 * A worker processes intended to be launched by the `./master.js` module.
 * Loads one polygon layer into memory, builds a `PolygonLookup` for it, and
 * then returns intersection results for `search` queries.
 */

var logger = require( 'pelias-logger').get('admin-lookup:worker');
var PolygonLookup = require('polygon-lookup');

var readStream = require('./readStream');

var context = {
  adminLookup: null,// This worker's `PolygonLookup`.
  layer: '', // The name of this layer (eg, 'country', 'neighborhood').
  featureCollection: {
    features: []
  }
};

/**
 * Respond to messages from the parent process
 */
function messageHandler( msg ) {
  switch (msg.type) {
    case 'load'   : return handleLoadMsg(msg);
    case 'search' : return handleSearch(msg);
    case 'lookupById': return handleLookupById(msg);
    default       : logger.error('Unknown message:', msg);
  }
}

process.on( 'message', messageHandler );

function elapsedTime() {
  return ((Date.now() - context.startTime)/1000);
}

function handleLoadMsg(msg) {
  context.layer = msg.layer;
  process.title = context.layer;
  context.startTime = Date.now();

  readStream(msg.datapath, msg.layer, function(features) {
    context.featureCollection.features = features;
    context.adminLookup = new PolygonLookup( context.featureCollection );

    // load countries up into an object keyed on id
    if ('country' === context.layer) {
      context.byId = features.reduce(function(cumulative, feature) {
        cumulative[feature.properties.Id] = feature.properties;
        return cumulative;
      }, {});
    }

    process.send( {
      type: 'loaded',
      layer: context.layer,
      size: features.length,
      seconds: elapsedTime()
    });

  });

}

function handleSearch(msg) {
  process.send({
    layer: context.layer,
    type: 'results',
    id: msg.id,
    results: search( msg.coords )
  });
}

/**
 * Search `adminLookup` for `latLon`.
 */
function search( latLon ){
  var poly = context.adminLookup.search( latLon.longitude, latLon.latitude );

  return (poly === undefined) ? {} : poly.properties;
}

function handleLookupById(msg) {
  process.send({
    layer: context.layer,
    type: 'results',
    id: msg.id,
    results: lookupById(msg.countryId)
  });
}

// return a country layer or an empty object (country not found)
// only process if this is the country worker
function lookupById(id) {
  if ('country' === context.layer) {
    return context.byId[id] || {};
  }
}
