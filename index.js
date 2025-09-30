const peliasConfig = require('pelias-config').generate(require('./schema'));
const through = require('through2');
const _ = require('lodash');

function create(layers) {
  const config = _.get(peliasConfig, 'imports.adminLookup', {});
  if (config.enabled) {
    return require('./src/lookupStream')(resolver(layers), config);
  } else {
    return through.obj();
  }
}

function resolver(layers) {
  // use remote pip service if the 'url' key exists in one of the supported config blocks.
  // 'services.spatial' is the preferred config, for the legacy in-memory pip service you
  // should use the preferred 'services.pip' config, the 'imports.services.pip' config is
  // supported for backwards compatibility but is deprecated.
  for (const key of ['services.spatial', 'services.pip', 'imports.services.pip']) {
    const config = _.get(peliasConfig, key);
    if (_.has(config, 'url')) {
      return require('./src/remotePipResolver')(config, layers);
    }
  }

  return localResolver(layers);
}

function localResolver(layers) {

  // use spatial service if configured
  if (_.has(peliasConfig, 'services.spatial')) {
    return require('./src/spatialPipResolver')();
  }

  // otherwise use legacy local pip resolver
  const datapath = _.get(peliasConfig, 'imports.whosonfirst.datapath', '');
  return require('./src/localPipResolver')(datapath, layers);
}

module.exports = {
  create: create,
  resolver: resolver,
  localResolver: localResolver
};
