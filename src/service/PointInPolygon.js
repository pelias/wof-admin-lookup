'use strict';

const url = require('url');

const ServiceConfiguration = require('pelias-microservice-wrapper').ServiceConfiguration;

class PointInPolygon extends ServiceConfiguration {
  constructor(o) {
    super('pip', o);
  }

  getParameters(req) {
    // always search only land-based layers
    return {
      layers: [ 'neighbourhood', 'borough', 'locality', 'localadmin', 'county',
                'macrocounty', 'region', 'macroregion', 'dependency', 'country' ]
    };
  }

  getUrl(params) {
    // use resolve to eliminate possibility of duplicate /'s in URL
    return url.resolve(this.baseUrl, `${params.lon}/${params.lat}`);
  }
}

module.exports = PointInPolygon;
