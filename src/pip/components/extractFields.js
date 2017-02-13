'use strict';

var map = require('through2-map');
var _ = require('lodash');
var iso3166 = require('iso3166-1');
const logger = require('pelias-logger').get('extractFields');

module.exports.create = function() {
  // this function extracts the id, name, placetype, hierarchy, and geometry
  return map.obj(function(wofData) {
    const res = {
      properties: {
        Id: wofData.properties['wof:id'],
        Name: getName(wofData),
        Placetype: wofData.properties['wof:placetype'],
        Hierarchy: wofData.properties['wof:hierarchy']
      },
      geometry: wofData.geometry
    };

    // only add abbreviation if it is a country
    if (res.properties.Placetype === 'country') {
      res.properties.Abbrev = getAbbr(wofData);
    }

    return res;
  });
};

/**
 * Return the ISO3 country code where available
 *
 * @param {object} wofData
 * @returns {null|string}
 */
function getAbbr(wofData) {
  const iso2 = getPropertyValue(wofData, 'wof:country');

  // sometimes there are codes set to XX which cause an exception so check if it's a valid ISO2 code
  if (iso2 !== false && iso3166.is2(iso2)) {
    return iso3166.to3(iso2);
  }

  return null;
}

/**
 * Return the localized name or default name for the given record
 *
 * @param {object} wofData
 * @returns {false|string}
 */
function getName(wofData) {

  // if this is a US county, use the qs:a2_alt for county
  // eg - wof:name = 'Lancaster' and qs:a2_alt = 'Lancaster County', use latter
  if (isUsCounty(wofData)) {
    return getPropertyValue(wofData, 'qs:a2_alt');
  }

  // attempt to use the following in order of priority and fallback to wof:name if all else fails
  return getLocalizedName(wofData, 'wof:lang_x_spoken') ||
    getLocalizedName(wofData, 'wof:lang_x_official') ||
    getLocalizedName(wofData, 'wof:lang') ||
    getPropertyValue(wofData, 'wof:label') ||
    getPropertyValue(wofData, 'wof:name');
}

// this function is used to verify that a US county QS altname is available
function isUsCounty(wofData) {
  return 'US' === wofData.properties['iso:country'] &&
        'county' === wofData.properties['wof:placetype'] &&
        !_.isUndefined(wofData.properties['qs:a2_alt']);
}

/**
 * Returns the property name of the name to be used
 * according to the language specification
 *
 * example:
 *  if wofData[langProperty] === ['rus']
 *  then return 'name:rus_x_preferred'
 *
 * example with multiple values:
 *  if wofData[langProperty] === ['rus','ukr','eng']
 *  then return 'name:rus_x_preferred'
 *
 * @param {object} wofData
 * @param {string} langProperty
 * @returns {string}
 */
function getOfficialLangName(wofData, langProperty) {
  var languages = wofData.properties[langProperty];

  // convert to array in case it is just a string
  if (!(languages instanceof Array)) {
    languages = [languages];
  }

  if (languages.length > 1) {
    logger.silly(`more than one ${langProperty} specified`,
      wofData.properties['wof:lang_x_official'], languages);
  }

  // for now always just grab the first language in the array
  return `name:${languages[0]}_x_preferred`;
}

/**
 * Given a language property name return the corresponding name:* property if one exists
 * and false if that can't be found for any reason
 *
 * @param {object} wofData
 * @param {string} langProperty
 * @returns {false|string}
 */
function getLocalizedName(wofData, langProperty) {

  // check that there is a value at the specified property and that it's not
  // set to unknown or undefined
  if (wofData.properties.hasOwnProperty(langProperty) &&
      !_.isEmpty(wofData.properties[langProperty]) &&
      wofData.properties[langProperty] !== 'unk' &&
      wofData.properties[langProperty] !== 'und' &&
      !_.isEqual(wofData.properties[langProperty], ['unk']) &&
      !_.isEqual(wofData.properties[langProperty], ['und'])) {

    // build the preferred lang key to use for name, like 'name:deu_x_preferred'
    var official_lang_key = getOfficialLangName(wofData, langProperty);

    // check if that language is available
    var name = getPropertyValue(wofData, official_lang_key);
    if (name) {
      return name;
    }

    // if corresponding name property wasn't found, log the error
    logger.warn(langProperty, '[missing]', official_lang_key, wofData.properties['wof:name'],
      wofData.properties['wof:placetype'], wofData.properties['wof:id']);
  }
  return false;
}

/**
 * Get the string value of the property or false if not found
 *
 * @param {object} wofData
 * @param {string} property
 * @returns {false|string}
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