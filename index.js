const peliasConfig = require('pelias-config').generate();
require('./src/configValidation').validate(peliasConfig);

const _ = require('lodash');
const os = require('os');

module.exports = {
  createLookupStream: function () {
    const datapath = peliasConfig.imports.whosonfirst.datapath;
    const resolver = require('./src/localPipResolver')(datapath);
    const maxConcurrentReqs = _.get(peliasConfig, 'imports.adminLookup.maxConcurrentReqs', 1);

    return require('./src/lookupStream')(resolver, maxConcurrentReqs);
  }
};
