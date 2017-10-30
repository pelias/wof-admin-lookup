'use strict';

const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

function create(layers) {
  if (peliasConfig.imports.adminLookup.enabled) {
    return require('./src/lookupStream')(resolver(layers),
      peliasConfig.imports.adminLookup.maxConcurrentReqs);
  } else {
    return through.obj();
  }
}

function resolver(layers) {
  if (_.has(peliasConfig, 'imports.services.pip')) {
    return require('./src/remotePipResolver')(peliasConfig.imports.services.pip);
  } else {
    const datapath = peliasConfig.imports.whosonfirst.datapath;
    return require('./src/localPipResolver')(datapath, layers);
  }
}

module.exports = {
  create: create,
  resolver: resolver
};
