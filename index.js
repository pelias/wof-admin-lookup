'use strict';

const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

module.exports = {
  create: (layers) => {
    if (peliasConfig.imports.adminLookup.enabled) {
      if (_.has(peliasConfig, 'imports.services.pip.url')) {
        const resolver = require('./src/remotePipResolver')(peliasConfig.imports.services.pip.url);

        return require('./src/lookupStream')(resolver,
          peliasConfig.imports.adminLookup.maxConcurrentReqs);

      } else {
        const datapath = peliasConfig.imports.whosonfirst.datapath;
        const resolver = require('./src/localPipResolver')(datapath, layers);

        return require('./src/lookupStream')(resolver,
          peliasConfig.imports.adminLookup.maxConcurrentReqs);
      }
    } else {
      return through.obj();
    }

  },
  resolver: (datapath) => {
    const resolver = require('./src/localPipResolver')(
      datapath || peliasConfig.imports.whosonfirst.datapath);
    return resolver;
  }

};
