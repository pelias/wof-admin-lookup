const peliasConfig = require('pelias-config').generate();
require('./src/configValidation').validate(peliasConfig);

const _ = require('lodash');

const options = {
  maxConcurrentReqs: _.get(peliasConfig, 'imports.adminLookup.maxConcurrentReqs', 1),
  suspectFile: _.get(peliasConfig, 'logger.suspectFile', false)
};

module.exports = {
  createLookupStream: require('./src/lookupStream')(options),
  createWofPipResolver: require('./src/httpPipResolver')(options),
  createLocalWofPipResolver: require('./src/localPipResolver')(peliasConfig.imports.whosonfirst.datapath)
};
