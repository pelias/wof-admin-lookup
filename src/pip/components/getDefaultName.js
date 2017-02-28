'use strict';

const _ = require('lodash');

// this function is used to verify that a US county QS altname is available
function isUsCounty(wofData) {
  return 'US' === wofData.properties['iso:country'] &&
    'county' === wofData.properties['wof:placetype'] &&
    !_.isUndefined(wofData.properties['qs:a2_alt']);
}

// if this is a US county, use the qs:a2_alt for county
// eg - wof:name = 'Lancaster' and qs:a2_alt = 'Lancaster County', use latter
function getName(wofData) {
  if (isUsCounty(wofData)) {
    return wofData.properties['qs:a2_alt'];
  }

  if (wofData.properties.hasOwnProperty('wof:label')) {
    return wofData.properties['wof:label'];
  }

  return wofData.properties['wof:name'];

}

module.exports = getName;