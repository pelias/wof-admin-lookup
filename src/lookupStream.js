var through2 = require('through2');
var _ = require('lodash');

function addAll(values, doc, placetype) {
  values.forEach(function(value) {
    doc.addParent(placetype, value.name, value.id.toString());
  });
}

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

regions.isSupportedCountry = function(country) {
  return this.hasOwnProperty(country);
};

regions.isSupportedRegion = function(country, name) {
  return this.hasOwnProperty(country) && this[country].hasOwnProperty(name);
};

regions.getAbbreviation = function(country, name) {
  return this[country][name];
};

function createLookupStream(resolver) {
  return through2.obj(function(doc, enc, callback) {
    // don't do anything if there's no centroid
    if (Object.keys(doc.getCentroid()).length === 0) {
      return callback(null, doc);
    }

    resolver(doc.getCentroid(), function(err, result) {
      if (err) {
        return callback(err, doc);
      }

      if (!_.isUndefined(result.country)) {
        doc.setAdmin( 'admin0', result.country[0].name);
        addAll(result.country, doc, 'country');
      }
      if (!_.isUndefined(result.region)) {
        doc.setAdmin( 'admin1', result.region[0].name);
        addAll(result.region, doc, 'region');
      }
      if (!_.isUndefined(result.county)) {
        doc.setAdmin( 'admin2', result.county[0].name);
        addAll(result.county, doc, 'county');
      }
      if (!_.isUndefined(result.locality)) {
        doc.setAdmin( 'locality', result.locality[0].name);
        addAll(result.locality, doc, 'locality');
      }
      if (!_.isUndefined(result.localadmin)) {
        doc.setAdmin( 'local_admin', result.localadmin[0].name);
        addAll(result.localadmin, doc, 'localadmin');
      }
      if (!_.isUndefined(result.neighbourhood)) {
        doc.setAdmin( 'neighborhood', result.neighbourhood[0].name);
        addAll(result.neighbourhood, doc, 'neighbourhood');
      }

      callback(null, doc);

    });

  });

}

module.exports = {
  createLookupStream: createLookupStream
};
