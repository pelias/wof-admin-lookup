var createLookupStream = require('./src/lookupStream');
var createWofPipResolver = require('./src/resolversFactory');

module.exports = {
  createLookupStream: createLookupStream.createLookupStream,
  createWofPipResolver: createWofPipResolver.createWofPipResolver,
  createLocalWofPipResolver: createWofPipResolver.createLocalPipResolver
};
