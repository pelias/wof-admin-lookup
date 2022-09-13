const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const peliasLogger = require('pelias-logger');
const logger = peliasLogger.get('wof-admin-lookup');

// load dictionary files
const endonyms = {
  country: loadEndonyms('country'),
  locality: loadEndonyms('locality-megacity')
};

/**
  This function appends additional endoymns as aliases for admin areas.

  The PIP service traditionally only returned a single name for parents,
  this causes issues where names from a foreign language are required.

  When this module is enabled, it will add additional names for all
  endonyms (ie. what the locals call a place).

  This is particularly helpful when we use the English name by default
  (eg. 'Germany') and so matching doesn't work equally when using the
  term 'Deutschland' instead.
**/
function useEndonyms(result, doc) {
  try {
    // iterate over all dictionaries loaded above
    _.each(endonyms, (mapping, placetype) => {

      // find the parent ID and check for a corresponding alias map
      let parentID = _.first(_.castArray(_.get(doc, `parent.${placetype}_id`, [])));
      if (!_.has(mapping, parentID, [])) { return; } // no mapping for ID

      // find parent source and ensure it is WOF (either explicitely or by omission)
      let parentSrc = _.first(_.get(doc, `parent.${placetype}_source`, []));
      if (!!parentSrc && parentSrc !== 'whosonfirst') { return; }

      // add each alias which is not already defined
      _.difference(
        _.get(mapping, parentID, []),
        _.castArray(_.get(doc, `parent.${placetype}`, []))
      ).forEach(alias => {
        // note: addParent can throw an error if, for example, alias is an empty string
        doc.addParent(placetype, alias, parentID);
      });
    });
  }
  catch (err) {
    logger.warn('failed to set endonym', err);
  }
}

// load PSV file, lines are delimited by a newline, rows by a pipe.
// the first column contains the WOFID and subsequent cells contain aliases
function loadEndonyms(name) {
  const filepath = path.resolve(__dirname, 'data/aliases', `${name}-endonyms.psv`);
  logger.debug(`[useEndonyms] loaded ${filepath}`);
  const rows = fs.readFileSync(filepath, 'utf8').trim().split('\n').map(r => r.split('|'));
  return rows.reduce((dict, row) => ({ ...dict, [_.first(row)]: row.slice(1) }), {});
}

module.exports = useEndonyms;
