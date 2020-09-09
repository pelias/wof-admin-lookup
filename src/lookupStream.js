const _ = require('lodash');
const async = require('async');
const parallelTransform = require('parallel-transform');
const logger = require( 'pelias-logger' ).get( 'wof-admin-lookup' );
const getAdminLayers = require( './getAdminLayers' );
const usePostalCity = require( './usePostalCity' );

function hasAnyMultiples(result) {
  return Object.keys(result).some((element) => {
    return result[element].length > 1;
  });
}

function updateDocument(doc, config, point, result) {
  // log results w/o country OR any multiples
  if (_.isEmpty(result.country)) {
    logger.debug('no country', {
      centroid: point,
      result: result
    });
  }
  if (hasAnyMultiples(result)) {
    logger.debug('multiple values', {
      centroid: point,
      result: result
    });
  }

  doc.getParentFields()
    // filter out placetypes for which there are no values
    .filter((placetype) => { return !_.isEmpty(result[placetype]); })
    // assign parents into the doc
    .forEach((placetype) => {
      const values = result[placetype];

      try {
        // addParent can throw an error if, for example, name is an empty string
        doc.addParent(placetype, values[0].name, values[0].id.toString(), values[0].abbr);

      }
      catch (err) {
        logger.warn('invalid value', {
          centroid: point,
          result: {
            type: placetype,
            values: values
          }
        });
      }
    });

  // prefer a 'postal city' locality when a valid postal code is available
  // optionally enable/disable this functionality using config variable.
  if (config && true === config.usePostalCities) {
    usePostalCity(result, doc);
  }
}

function createPipResolverStream(pipResolver, config) {
  return function (doc, callback) {
    // don't do anything if there's no centroid
    if (_.isEmpty(doc.getCentroid())) {
      return callback(null, doc);
    }

    let points = [doc.getCentroid()];
    const layers = getAdminLayers(doc.getLayer());

    // optionally, perform multiple lookups per document if additional
    //  points are specified in the 'pip' $meta property.
    const pip = doc.getMeta('pip');
    if( _.isArray(pip) && !_.isEmpty(pip) ){
      points = points.concat(
        pip.filter(point => {
          return _.isPlainObject(point) && _.has(point, 'lon') && _.has(point, 'lat');
        })
      );
    }

    var lookups = points.map(point => {
      return (cb) => {
        pipResolver.lookup(point, layers, (err, result) => {
          if (err) {
            // if there's an error, just log it and move on
            logger.error(`PIP server failed: ${(err.message || JSON.stringify(err))}`, {
              id: doc.getGid(),
              lat: point.lat,
              lon: point.lon
            });
            // don't pass the unmodified doc along
            return cb(err);
          }

          updateDocument(doc, config, point, result);
          cb();
        });
      };
    });

    async.parallel(lookups, (err) => {
      if (err) {
        return callback();
      }
      callback(null, doc);
    });
  };
}

function createPipResolverEnd(pipResolver) {
  return () => {
    if (typeof pipResolver.end === 'function') {
      pipResolver.end();
    }
  };
}

module.exports = function(pipResolver, config) {
  if (!pipResolver) {
    throw new Error('valid pipResolver required to be passed in as the first parameter');
  }

  // pelias 'imports.adminLookup' config section
  config = config || {};

  const pipResolverStream = createPipResolverStream(pipResolver, config);
  const end = createPipResolverEnd(pipResolver);

  const stream = parallelTransform(config.maxConcurrentReqs || 1, pipResolverStream);
  stream.on('end', end);

  return stream;
};
