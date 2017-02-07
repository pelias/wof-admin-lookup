'use strict';

var _ = require('lodash');
var parallelStream = require('pelias-parallel-stream');
var regions = require('../data/regions');
var peliasLogger = require( 'pelias-logger' );
var getAdminLayers = require( './getAdminLayers' );

//defaults to nowhere
var optsArg = {
  transports: []
};
//only prints to suspect records log if flag is set
optsArg.transports.push(new peliasLogger.winston.transports.File( {
  filename: 'suspect_wof_records.log',
  timestamp: false
}));

var logger = peliasLogger.get( 'wof-admin-lookup', optsArg );

regions.isSupported = function(country, name) {
  return this.hasOwnProperty(country) && this[country].hasOwnProperty(name);
};

regions.getCode = function(countries, regions) {
  if (_.isEmpty(countries) || _.isEmpty(regions)) {
    return undefined;
  }

  var country = countries[0].name;
  var region = regions[0].name;

  if (this.isSupported(country, region)) {
    return this[country][region];
  }

  return undefined;

};

function setFields(values, doc, wofFieldName, abbreviation) {
  try {
    if (!_.isEmpty(values)) {
      doc.addParent(wofFieldName, values[0].name, values[0].id.toString(), abbreviation);
    }
  }
  catch (err) {
    logger.info('invalid value', {
      centroid: doc.getCentroid(),
      result: {
        type: wofFieldName,
        values: values,
        abbreviation: abbreviation
      }
    });
  }
}

function hasAnyMultiples(result) {
  return Object.keys(result).some((element) => {
    return result[element].length > 1;
  });
}

function getCountryCode(result) {
  // return the abbreviation for the first country in the result
  if (_.get(result, 'country', []).length > 0) {
    return result.country[0].abbr;
  }
}

function createPipResolverStream(pipResolver) {
  return function (doc, enc, callback) {
    // don't do anything if there's no centroid
    if (_.isEmpty(doc.getCentroid())) {
      return callback(null, doc);
    }

    pipResolver.lookup(doc.getCentroid(), getAdminLayers(doc.getLayer()), (err, result) => {

      // assume errors at this point are fatal, so pass them upstream to kill stream
      if (err) {
        logger.error(err);
        return callback(new Error('PIP server failed: ' + (err.message || JSON.stringify(err))));
      }

      // log results w/o country OR any multiples
      if (_.isEmpty(result.country)) {
        logger.info('no country', {
          centroid: doc.getCentroid(),
          result: result
        });
      }
      if (hasAnyMultiples(result)) {
        logger.info('multiple values', {
          centroid: doc.getCentroid(),
          result: result
        });
      }

      var regionCode = regions.getCode(result.country, result.region);
      var countryCode = getCountryCode(result);

      // set code if available
      if (countryCode) {
        doc.setAlpha3(countryCode);
      }
      else {
        // TBD: remove this after debugging is done!!!
        logger.error('no country code', result);
      }

      setFields(result.country, doc, 'country', countryCode);
      setFields(result.macroregion, doc, 'macroregion');
      if (!_.isEmpty(result.region)) { // if there are regions, use them
        setFields(result.region, doc, 'region', regionCode);
      } else { // go with dependency for region (eg - Puerto Rico is a dependency)
        setFields(result.dependency, doc, 'region');
      }
      setFields(result.macrocounty, doc, 'macrocounty');
      setFields(result.county, doc, 'county');
      setFields(result.locality, doc, 'locality');
      setFields(result.localadmin, doc, 'localadmin');
      setFields(result.borough, doc, 'borough');
      setFields(result.neighbourhood, doc, 'neighbourhood');

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

module.exports = function(pipResolver, maxConcurrentReqs) {
  if (!pipResolver) {
    throw new Error('valid pipResolver required to be passed in as the first parameter');
  }

  const pipResolverStream = createPipResolverStream(pipResolver);
  const end = createPipResolverEnd(pipResolver);

  return parallelStream(maxConcurrentReqs || 1, pipResolverStream, end);

};
