const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

module.exports = {
  create: () => {
    if (peliasConfig.imports.adminLookup.enabled) {
      const datapath = peliasConfig.imports.whosonfirst.datapath;
      const resolver = require('./src/localPipResolver')(datapath);

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
