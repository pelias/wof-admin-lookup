
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
  var localities = postalCityMap.lookup(countrycode, postalcode);

  // check the localities list is valid
  if( !Array.isArray(localities) || !localities.length ){ return; }

  // we will use the first value instead of the PIP locality
  try {

    // save the existing locality as an alias
    // note: this would be better using getters, but the model does not
    // currently offer a 'getParent' method.
    if( doc.parent.hasOwnProperty('locality') && doc.parent.locality.length &&
        doc.parent.hasOwnProperty('locality_id') && doc.parent.locality_id.length &&
        doc.parent.hasOwnProperty('locality_a') && doc.parent.locality_a.length ){

      // append the existing localities on to the postal city localities array
      localities = localities.concat(
        doc.parent.locality.map((_, i) => {
          return {
            name:   doc.parent.locality[i],
            wofid:  doc.parent.locality_id[i],
            abbr:   doc.parent.locality_a[i]
          };
        })
      );
    }

    // remove the existing locality info
    doc.clearParent('locality');

    // deduplicate localities
    localities = localities.filter((locality, index, self) => {
      return index === self.findIndex(t => t.wofid === locality.wofid);
    });

    // add all localities, using the first matching postal locality as the default
    // and then indexing all other localities as aliases (including any existing localities)
    localities.forEach(locality => {

      // note: addParent can throw an error if, for example, name is an empty string
      doc.addParent('locality', locality.name, locality.wofid, locality.abbr);
    });
  }
  catch (err) {
    logger.warn('invalid value', {
      centroid: doc.getCentroid(),
      result: {
        type: 'locality',
        values: localities
      }
    });
  }
}

function getPostalCode(doc){
  return (doc.getAddress('zip') || '').toString();
}

function getCountryCode(result){
  if( Array.isArray(result.dependency) && result.dependency.length && result.dependency[0].abbr ){
    return result.dependency[0].abbr.toUpperCase();
  }
  if( Array.isArray(result.country) && result.country.length && result.country[0].abbr ){
    return result.country[0].abbr.toUpperCase();
  }
  return '';
}

module.exports = usePostalCity;
