var _ = require('lodash');
var parallelStream = require('pelias-parallel-stream');
var peliasConfig = require( 'pelias-config' ).generate();
var countries = require('../data/countries');
var regions = require('../data/regions');
var peliasLogger = require( 'pelias-logger' );
var getAdminLayers = require( './getAdminLayers' );

//defaults to nowhere
var optsArg = {
  transports: []
};
//only prints to suspect records log if flag is set
if (peliasConfig.logger.suspectFile === true){
  optsArg.transports.push(new peliasLogger.winston.transports.File( {
    filename: 'suspect_wof_records.log',
    timestamp: false
  }));
}

var logger = peliasLogger.get( 'wof-admin-lookup', optsArg );

countries.isSupported = function(country) {
  return this.hasOwnProperty(country);
};

countries.getCode = function(countries) {
  if (_.isEmpty(countries)) {
    return undefined;
  }

  if (this.isSupported(countries[0].name)) {
    return this[countries[0].name];
  }

  return undefined;

};

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
      var name = values[0].name;
      if (Array.isArray(name)) { // can now be an array
        for(var i=0; i<name.length; i++) {
          doc.addParent(wofFieldName, name[i], values[0].id.toString(), abbreviation);
        }
      } else {
        doc.addParent(wofFieldName, values[0].name, values[0].id.toString(), abbreviation);
      }
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

function hasCountry(result) {
  return _.isEmpty(result.country);
}

function hasAnyMultiples(result) {
  return Object.keys(result).some(function(element) {
    return result[element].length > 1;
  });
}

function createLookupStream(resolver, config) {

  if (!resolver) {
    throw new Error('createLookupStream requires a valid resolver to be passed in as the first parameter');
  }

  config = config || peliasConfig;

  var maxConcurrentReqs = 1;
  if (config.imports.adminLookup && config.imports.adminLookup.maxConcurrentReqs) {
    maxConcurrentReqs = config.imports.adminLookup.maxConcurrentReqs;
  }

  var stream = parallelStream(maxConcurrentReqs, function (doc, enc, callback) {

    // don't do anything if there's no centroid
    if (_.isEmpty(doc.getCentroid())) {
      return callback(null, doc);
    }

    resolver.lookup(doc.getCentroid(), function (err, result) {

      // assume errors at this point are fatal, so pass them upstream to kill stream
      if (err) {
        logger.error(err);
        return callback(new Error('PIP server failed: ' + (err.message || JSON.stringify(err))));
      }

      // log results w/o country OR any multiples
      if (hasCountry(result)) {
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
      var countryCode = countries.getCode(result.country);

      // set code if available
      if (!_.isUndefined(countryCode)) {
        doc.setAlpha3(countryCode);
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

      if ( result.postalcode ) {
        var postalcode = result.postalcode[0].name;
        if (postalcode && postalcode !== '') {
          var zip = doc.getAddress('zip');
          if (!zip || zip === '') {
            doc.setAddress('zip', postalcode);
          }
        }
      }

      callback(null, doc);
    }, getAdminLayers(doc.getLayer()));
  },
  function end() {
    if (typeof resolver.end === 'function') {
      resolver.end();
    }
  });

  return stream;
}

module.exports = {
  createLookupStream: createLookupStream
};
