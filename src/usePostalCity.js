
const peliasLogger = require('pelias-logger');
const logger = peliasLogger.get('wof-admin-lookup');
const postalCityMap = require('./postalCityMap');

/**
  This function allows overriding the locality returned
  by the Point-in-Polygon query with a different locality record
  which was mapped from the postalcode using a lookup table.

  If the Point-in-Polygon query returned a valid locality then
  it is added as an alias for the 'Postal City'.
**/

function usePostalCity( result, doc ){

  // find record postal code
  const postalcode = getPostalCode(doc);

  // check we have a valid postal code
  if( !postalcode || !postalcode.length ){ return; }

  // find record country code
  const countrycode = getCountryCode(result);

  // check we have a valid country code
  if( !countrycode || countrycode.length !== 3 ){ return; }

  // look up the 'postal city' locality
  const locality = postalCityMap.lookup(countrycode, postalcode);

  // check the locality is valid
  if( !locality ){ return; }

  // we will use it instead of the PIP locality
  try {

    // save the existing locality as an alias
    // note: this would be better using getters, but the model does not
    // currently offer a 'getParent' method.
    var pipLocality;
    if( doc.parent.hasOwnProperty('locality') && doc.parent.locality.length &&
        doc.parent.hasOwnProperty('locality_id') && doc.parent.locality_id.length &&
        doc.parent.hasOwnProperty('locality_a') && doc.parent.locality_a.length ){
      pipLocality = {
        name: doc.parent.locality[0],
        wofid: doc.parent.locality_id[0],
        abbr: doc.parent.locality_a[0],
      };
    }

    // remove the existing locality
    doc.clearParent('locality');

    // addParent can throw an error if, for example, name is an empty string
    doc.addParent('locality', locality.name, locality.wofid, locality.abbr);

    // add the original PIP locality as an alias
    if( pipLocality ){
      doc.addParent('locality', pipLocality.name, pipLocality.wofid, pipLocality.abbr);
    }
  }
  catch (err) {
    logger.info('invalid value', {
      centroid: doc.getCentroid(),
      result: {
        type: 'locality',
        values: [locality]
      }
    });
  }
}

function getPostalCode(doc){
  return (doc.getAddress('zip') || '').toString().replace(/\s/g, '');
}

function getCountryCode(result){
  if( Array.isArray(result.country) && result.country.length ){
    return (result.country[0].abbr || '').toUpperCase();
  }
}

module.exports = usePostalCity;