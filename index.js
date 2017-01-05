const peliasConfig = require('pelias-config').generate();
require('./src/configValidation').validate(peliasConfig);

var createLookupStream = require('./src/lookupStream');
var createWofPipResolver = require('./src/resolversFactory');

module.exports = {
  createLookupStream: createLookupStream.createLookupStream,
  createWofPipResolver: createWofPipResolver.createWofPipResolver,
  createLocalWofPipResolver: createWofPipResolver.createLocalPipResolver
};
