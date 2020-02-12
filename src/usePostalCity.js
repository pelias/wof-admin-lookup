const _ = require('lodash');
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
  var alternatives = postalCityMap.lookup(countrycode, postalcode);

  // check the alternatives list is valid
  if (!_.isArray(alternatives) || _.isEmpty(alternatives) ){ return; }

  // It's possible for alternatives to include multiple differing
  // placetypes, such as:
  // 11225	421205765	Brooklyn		borough	23
  // 11225	85977539	New York	NYC	locality	1

  // select which placetypes to consider for replacement
  updateParentProperty(doc, 'locality', alternatives);
  updateParentProperty(doc, 'borough', alternatives);
}

function updateParentProperty(doc, placetype, allAlternatives){
  // reduce the list of alternatives to only those that match
  // the target placetype.
  var alternatives = allAlternatives.filter(a => a.placetype === placetype);

  // ensure that there is at least one alternative for this placetype
  if( !_.isArray(alternatives) || _.isEmpty(alternatives) ){ return; }

  // abort if the postal cities ids are already in _any_ of the parent id fields
  const alternative_ids = alternatives.map(alternative => alternative.wofid);
  if (_.intersection(getParentIDs(doc), alternative_ids).length > 0) { return; }

  // we will use the first postal cities value as the 'primary' value for name/id/abbr.
  // all other values will be added as 'aliases'.
  // if a value was already set from PIP it will be converted to an alias and preserved.
  try {

    // save the existing placetype as an alias
    // note: this would be better using getters, but the model does not
    // currently offer a 'getParent' method.
    const names = _.get(doc, `parent.${placetype}`);
    const ids = _.get(doc, `parent.${placetype}_id`);
    const abbrs = _.get(doc, `parent.${placetype}_a`);

    if ( _.isArray(names) && !_.isEmpty(names) &&
         _.isArray(ids) && !_.isEmpty(ids) &&
         _.isArray(abbrs) && !_.isEmpty(abbrs)) {

      // append the existing alternatives on to the postal city alternatives array
      alternatives = alternatives.concat(
        names.map((_, i) => {
          return {
            name: names[i],
            wofid: ids[i],
            abbr: abbrs[i]
          };
        })
      );
    }

    // remove the existing locality info
    doc.clearParent(placetype);

    // deduplicate alternatives
    alternatives = alternatives.filter((alternative, index, self) => {
      return index === self.findIndex(t => t.wofid === alternative.wofid);
    });

    // add all alternatives, using the first matching postal alternative as the default
    // and then indexing all other alternatives as aliases (including any existing alternatives)
    alternatives.forEach(alternative => {

      // note: addParent can throw an error if, for example, name is an empty string
      doc.addParent(placetype, alternative.name, alternative.wofid, alternative.abbr);
    });
  }
  catch (err) {
    logger.warn('invalid value', {
      centroid: doc.getCentroid(),
      result: {
        type: placetype,
        values: alternatives
      }
    });
  }
}

function getParentIDs(doc) {
  const ids = Object.keys(doc.parent).filter(key => key.match(/_id$/)).map(key => doc.parent[key]);
  return _.flatten(ids);
}

function getPostalCode(doc){
  return (doc.getAddress('zip') || '').toString();
}

function getCountryCode(result){
  if (_.isArray(result.dependency) && !_.isEmpty(result.dependency) && result.dependency[0].abbr ){
    return result.dependency[0].abbr.toUpperCase();
  }
  if (_.isArray(result.country) && !_.isEmpty(result.country) && result.country[0].abbr ){
    return result.country[0].abbr.toUpperCase();
  }
  return '';
}

module.exports = usePostalCity;
