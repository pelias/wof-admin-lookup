'use strict';

const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

module.exports = {
  create: (layers) => {
    if (peliasConfig.imports.adminLookup.enabled) {
      let resolver;
      if (_.has(peliasConfig, 'imports.services.pip.url')) {
        resolver = require('./src/remotePipResolver')(peliasConfig.imports.services.pip.url);
      } else {
        const datapath = peliasConfig.imports.whosonfirst.datapath;
       resolver = require('./src/localPipResolver')(datapath, layers);
      }

      return require('./src/lookupStream')(resolver,
        peliasConfig.imports.adminLookup.maxConcurrentReqs);
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
