const _ = require('lodash');
const { stream, whosonfirst } = require('@whosonfirst/wof');

/**
 * this script can be used to generate '*-endonyms.psv' files from
 * whosonfirst bundle files.
 *
 * note: I've not included the dependencies in package.json since
 * this script is seldom run: npm install @whosonfirst/wof
 */

// reduce the language map to a key/value dict where the key
// is the wofid and the value is an array containing all unique language tags.
const languageMap = _.pickBy(
  _.mapValues(require('./country-language-map'), (config) => {
    return _.union(/*config.spoken, */config.official);
  }),
  _.negate(_.isEmpty)
);

// extract endonyms from target bundle file
const BUNDLE_FILE = '/data/wof/whosonfirst-data-country-latest.tar.bz2';
// const BUNDLE_FILE = '/data/wof/whosonfirst-data-locality-latest.tar.bz2'

stream.bsdtar.extract('-f', BUNDLE_FILE, '--include', '*.geojson', '--exclude', '*-alt-*')
  .pipe(stream.json.parse())
  .pipe(stream.miss.through.obj((feature, enc, next) => {
    if (!whosonfirst.feature.isCurrent()) { return next(); }
    if (whosonfirst.feature.isAltGeometry()) { return next(); }
    // if (_.get(feature, 'properties.wof:megacity') !== 1) { return next() }

    // find which country the feature belongs to
    const countryID = _.get(feature, 'properties.wof:hierarchy[0].country_id');
    if (!countryID) { return next(); }

    // find all endonyms for the feature
    // ie. place names in all official local languages
    const endonyms = _.pickBy(
      _.get(feature, 'properties'),
      (v, k) => {
        if (k === `name:eng_x_preferred`) { return true; }
        const matches = k.match(/name:([a-z]{3})_x_preferred/);
        if (!matches) { return false; }
        return _.get(languageMap, countryID, []).includes(matches[1]);
      }
    );
    if (_.isEmpty(endonyms)) { return next(); }

    // whosonfirst can be verbose, so only select the first toponym
    // per language. ie. there can be at most one alias per language code.
    const flattened = _.uniq(_.values(_.mapValues(endonyms, _.first)));

    // find WOF ID
    const wofID = whosonfirst.feature.getID(feature);

    // write out pipe-seperated list
    console.log(_.concat(wofID, _.sortBy(flattened)).join('|'));

    next();
  }));
