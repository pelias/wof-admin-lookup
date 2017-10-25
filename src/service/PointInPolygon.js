'use strict';

const url = require('url');

const ServiceConfiguration = require('pelias-microservice-wrapper').ServiceConfiguration;

class PointInPolygon extends ServiceConfiguration {
  constructor(o) {
    super('pip', o);
  }

  getUrl(params) {
    // use resolve to eliminate possibility of duplicate /'s in URL
    return url.resolve(this.baseUrl, `${params.lon}/${params.lat}`);
  }
}

module.exports = PointInPolygon;
