'use strict';

var map = require('through2-map');
var _ = require('lodash');

const getDefaultName = require('./getDefaultName');
const getLocalizedName = require('./getLocalizedName');
const getLocalizedAbbreviation = require('./getLocalizedAbbreviation');


/**
 * Returns a data object with all fields filled in.
 *
 * @param {boolean} enableLocalizedNames
 * @returns {object}
 */
module.exports.create = function (enableLocalizedNames) {

  enableLocalizedNames = enableLocalizedNames || false;

  // this function extracts the id, name, placetype, hierarchy, and geometry
  return map.obj(function (wofData) {
    const res = {
      properties: {
        Id: wofData.properties['wof:id'],
        Name: getName(wofData, enableLocalizedNames),
        Placetype: wofData.properties['wof:placetype'],
        Centroid: {
          lat: wofData.properties['geom:latitude'],
          lon: wofData.properties['geom:longitude']
        },
        BoundingBox: wofData.properties['geom:bbox']
      },
      geometry: wofData.geometry
    };

    if (!_.isEmpty(wofData.properties['wof:hierarchy'])) {
      // if there's a wof:hierarchy, condense down to just the ids
      res.properties.Hierarchy = _.map(wofData.properties['wof:hierarchy'], hierarchy => _.values(hierarchy));
    } else {
      // otherwise, synthesize a hierarchy from the records' id
      res.properties.Hierarchy = [[res.properties.Id]];
    }

    res.properties.Abbrev = getAbbreviation(wofData);

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
 * Return an abbreviation based on the first defined value across several fields
 * 
 * @param {object} wofData
 * @param {boolean} enableLocalizedNames
 * @returns {boolean|string}
 */
function getAbbreviation(wofData, enableLocalizedNames) {
  const props = wofData.properties;
  const placetype = props['wof:placetype'];

  // countries have additional properties to check that
  // may contain 3-character codes
  if (['country', 'dependency'].includes(placetype)) {
    return props['wof:country_alpha3'] ||
      props['qs:adm0_a3'] ||
      props['ne:adm0_a3'] ||
      //the following properties generally contain a 2-character codes
      //instead of 3 character and are therefore not preferred
      props['wof:shortcode'] ||
      props['wof:abbreviation'];
  } else {
    if (enableLocalizedNames) {
      return getLocalizedAbbreviation(wofData);
    }
    //Shorth
    return props['wof:shortcode'] ||
      props['wof:abbreviation'];
  }
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
