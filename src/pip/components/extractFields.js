'use strict';

var map = require('through2-map');
var _ = require('lodash');

const getDefaultName = require('./getDefaultName');
const getLocalizedName = require('./getLocalizedName');


/**
 * Returns a data object with all fields filled in.
 *
 * @param {boolean} enableLocalizedNames
 * @returns {object}
 */
module.exports.create = function(enableLocalizedNames) {

  enableLocalizedNames = enableLocalizedNames || false;

  // this function extracts the id, name, placetype, hierarchy, and geometry
  return map.obj(function(wofData) {
    const res = {
      properties: {
        Id: wofData.properties['wof:id'],
        Name: getName(wofData, enableLocalizedNames),
        Placetype: wofData.properties['wof:placetype'],
        Hierarchy: wofData.properties['wof:hierarchy'],
        Centroid: {
          lat: wofData.properties['geom:latitude'],
          lon: wofData.properties['geom:longitude']
        },
        BoundingBox: wofData.properties['geom:bbox']
      },
      geometry: wofData.geometry
    };

    // use different abbreviation field for country
    if (res.properties.Placetype === 'country') {
      res.properties.Abbrev = wofData.properties['wof:country_alpha3'];
    } else {
      res.properties.Abbrev = wofData.properties['wof:abbreviation'];
    }

    return res;
  });
};

/**
 * Return the name of the record based on which extraction strategy is preferred.
 *
 * @param {object} wofData
 * @param {boolean} enableLocalizedNames
 * @returns {boolean|string}
 */
function getName(wofData, enableLocalizedNames) {
  if (enableLocalizedNames === true) {
    return getLocalizedName(wofData);
  }
  return getDefaultName(wofData);
}

/**
 * Get the string value of the property or false if not found
 *
 * @param {object} wofData
 * @param {string} property
 * @returns {boolean|string}
 */
function getPropertyValue(wofData, property) {

  if (wofData.properties.hasOwnProperty(property)) {

    // if the value is an array, return the first item
    if (wofData.properties[property] instanceof Array) {
      return wofData.properties[property][0];
    }

    // otherwise just return the value as is
    return wofData.properties[property];
  }
  return false;
}
