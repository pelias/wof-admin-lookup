const _ = require('lodash');
const peliasLogger = require('pelias-logger');
const logger = peliasLogger.get('wof-admin-lookup');

/**
  This function copies postal code information from the admin hierarchy
  (parent.postalcode) to the address parts (address_parts.zip) so that
  postal codes can be used for search and display in Pelias results.

  The function only sets address_parts.zip if no existing postal code exists,
  ensuring that authoritative postal codes from OpenAddresses, OSM, etc. are
  never overwritten by algorithmically-derived postal codes from polygon lookup.
**/

function setPostalCodeInAddressParts( result, doc ){

  // check if we have postal code data in the admin hierarchy
  if (!_.isArray(result.postalcode) || _.isEmpty(result.postalcode)) {
    return;
  }

  // get the first (highest priority) postal code from the result
  const postalcodeData = result.postalcode[0];

  // check if we have valid postal code data
  if (!postalcodeData || !postalcodeData.name) {
    return;
  }

  try {
    const existingZip = doc.getAddress('zip');

    if (!existingZip || existingZip.length === 0) {
      doc.setAddress('zip', postalcodeData.name);

      logger.debug('Set postal code from admin lookup', {
        postalcode: postalcodeData.name,
        centroid: doc.getCentroid()
      });
    }
  }
  catch (err) {
    logger.warn('Failed to set postal code in address parts', {
      centroid: doc.getCentroid(),
      postalcode: postalcodeData,
      error: err.message
    });
  }
}

module.exports = setPostalCodeInAddressParts;