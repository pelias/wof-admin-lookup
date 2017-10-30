'use strict';

const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

module.exports = {
  create: (layers) => {
    if (peliasConfig.imports.adminLookup.enabled) {
      const resolver = module.exports.resolver(layers);

      return require('./src/lookupStream')(resolver,
        peliasConfig.imports.adminLookup.maxConcurrentReqs);
    } else {
      return through.obj();
    }
  },

  resolver: (layers) => {
    let resolver;
    if (_.has(peliasConfig, 'imports.services.pip.url')) {
      resolver = require('./src/remotePipResolver')(peliasConfig.imports.services.pip.url);
    } else {
      const datapath = peliasConfig.imports.whosonfirst.datapath;
      resolver = require('./src/localPipResolver')(datapath, layers);
    }

    return resolver;
  }
};
