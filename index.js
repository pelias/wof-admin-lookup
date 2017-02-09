const peliasConfig = require('pelias-config').generate(require('./schema'));

const through = require('through2');
const _ = require('lodash');
const os = require('os');

module.exports = {
  createLookupStream: () => {
    if (_.get(peliasConfig, 'imports.adminLookup.enabled', true)) {
      const datapath = peliasConfig.imports.whosonfirst.datapath;
      const resolver = require('./src/localPipResolver')(datapath);

      // default maxConcurrentReqs to the number of cpus/cores * 10
      const maxConcurrentReqs = _.get(peliasConfig, 'imports.adminLookup.maxConcurrentReqs', os.cpus().length*10);

      return require('./src/lookupStream')(resolver, maxConcurrentReqs);

    } else {
      return through.obj();
    }

  }
};
