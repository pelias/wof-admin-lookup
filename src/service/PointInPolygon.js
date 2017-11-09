'use strict';

const url = require('url');
const _ = require('lodash');

const ServiceConfiguration = require('pelias-microservice-wrapper').ServiceConfiguration;

// allow searching only against land layers, or a filtered subset of land layers
function calculateLayers(inputLayers) {
  const allowedLayers = [ 'neighbourhood', 'borough', 'locality', 'localadmin', 'county',
    'macrocounty', 'region', 'macroregion', 'dependency', 'country' ];

  // if no input layers are specified, return all of the allowed layers
  if (!inputLayers) {
    inputLayers = allowedLayers;
  }

  return _.intersection(allowedLayers, inputLayers);
}

class PointInPolygon extends ServiceConfiguration {
  constructor(o, layers) {
    super('pip', o);
    this.layers = calculateLayers(layers);
  }

  getParameters(req) {
    return {
      layers: this.layers
    };
  }

  getUrl(params) {
    // use resolve to eliminate possibility of duplicate /'s in URL
    return url.resolve(this.baseUrl, `${params.lon}/${params.lat}`);
  }
}

module.exports = PointInPolygon;
