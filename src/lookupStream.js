var through2 = require('through2');
var _ = require('lodash');
var peliasLogger = require( 'pelias-logger' );

// only US is currently supported
// to support more countries, add them in a similar fashion
var regions = {
  'United States': {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'Washington, D.C.': 'DC',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
  }
};

regions.isSupportedRegion = function(country, name) {
  return this.hasOwnProperty(country) && this[country].hasOwnProperty(name);
};

regions.getAbbreviation = function(countries, regions) {
  if (_.isEmpty(countries) || _.isEmpty(regions)) {
    return undefined;
  }

  var country = countries[0].name;
  var region = regions[0].name;

  if (this.isSupportedRegion(country, region)) {
    return this[country][region];
  }

  return undefined;

};

function setFields(values, doc, qsFieldName, wofFieldName, abbreviation) {
  if (!_.isEmpty(values)) {
    doc.setAdmin( qsFieldName, values[0].name);
    doc.addParent( wofFieldName, values[0].name, values[0].id.toString(), abbreviation);
  }
}

function createLookupStream(resolver) {
  var logger = peliasLogger.get( 'whosonfirst', {
    transports: [
      new peliasLogger.winston.transports.File( {
        filename: 'suspect_wof_records.log',
        timestamp: false
      })
    ]
  });

  return through2.obj(function(doc, enc, callback) {
    // don't do anything if there's no centroid
    if (_.isEmpty(doc.getCentroid())) {
      return callback(null, doc);
    }

    resolver(doc.getCentroid(), function(err, result) {
      if (err) {
        return callback(err, doc);
      }

      // log results w/o country
      if (_.isEmpty(result.country)) {
        logger.info(doc.getCentroid(), result);
      }

      // log results with any multiples
      if (Object.keys(result).some(function(element) {
        return result[element].length > 1;
      })) {
        logger.info(doc.getCentroid(), result);
      }

      var regionAbbr = regions.getAbbreviation(result.country, result.region);

      setFields(result.country, doc, 'admin0', 'country');
      setFields(result.region, doc, 'admin1', 'region', regionAbbr);
      setFields(result.county, doc, 'admin2', 'county');
      setFields(result.locality, doc, 'locality', 'locality');
      setFields(result.localadmin, doc, 'local_admin', 'localadmin');
      setFields(result.neighbourhood, doc, 'neighborhood', 'neighbourhood');

      callback(null, doc);

    });

  });

}

module.exports = {
  createLookupStream: createLookupStream
};
