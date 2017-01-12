const peliasConfig = require('pelias-config').generate();
require('./src/configValidation').validate(peliasConfig);

const _ = require('lodash');

const maxConcurrentReqs = _.get(peliasConfig, 'imports.adminLookup.maxConcurrentReqs', 1);
const datapath = peliasConfig.imports.whosonfirst.datapath;

module.exports = {
  createLookupStream: require('./src/lookupStream')(maxConcurrentReqs),
  createWofPipResolver: require('./src/httpPipResolver')(maxConcurrentReqs),
  createLocalWofPipResolver: require('./src/localPipResolver')(datapath)
};
