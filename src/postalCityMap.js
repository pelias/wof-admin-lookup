
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const stable = require('stable');
const csv = require('csv-parse/lib/sync');
const config = require('pelias-config').generate();
const logger = require('pelias-logger').get('wof-admin-lookup');
const tsvOptions = {
  trim: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax: true,
  columns: [ 'postalcode', 'wofid', 'name', 'abbr', 'placetype', 'weight' ],
  delimiter: '\t'
};

// $searchPaths behaves like the unix $PATH and $LD_LIBRARY_PATH variables,
// you may specify multiple search paths to check for data files and the first matching
// path will be used, subsequent paths matching the same file name will be ignored.
// note: by default we use the data bundled within this module.
const searchPaths = [path.resolve(__dirname, 'data')];

// you may optionally change the location of where the TSV files are loaded
// from by specifying an absolute path in your pelias.json file.
// eg: imports.adminLookup.postalCitiesDataPath = "/data/postal_cities"
const configDataPath = _.get(config, 'imports.adminLookup.postalCitiesDataPath');
if (_.isString(configDataPath) && !_.isEmpty(configDataPath) && fs.existsSync(configDataPath)) {
  searchPaths.unshift(configDataPath);
}

// ISO country codes using the USA 'zip' system
const USA_ISO_CODES = ['USA','ASM','GUM','MNP','PRI','VIR'];

/**
  This function loads 'Postal City' table files from disk
  in to memory, for fast lookups.

  The table files contain 5 columns delimited by a comma.

  The columns are:
  1. Postal Code
  2. Whosonfirst ID
  3. Place Name
  4. Place Abbreviation (where available)
  5. A 'weight' which scores the place when resolving duplicates (higher values are considered more correct)

  Mappings for additional countries would be greatly appreciated,
  please open a Pull Request.
**/

// select which ISO country code files are loaded.
const tables = {
  'ASM': loadTable('ASM'), // American Samoa
  'GUM': loadTable('GUM'), // Guam
  'MNP': loadTable('MNP'), // Northern Mariana Islands
  'PRI': loadTable('PRI'), // Puerto Rico
  'USA': loadTable('USA'), // Unites States of America
  'VIR': loadTable('VIR'), // United States Virgin Islands
  'NLD': loadTable('NLD'), // The Netherlands
  'NZL': loadTable('NZL')  // New Zealand
};

// load the file format in to memory
function loadTable(cc){
  var m = {};

  // load files from disk and parse contents
  var rows = [];

  // load base TSV file
  searchPaths.some(datapath => {
    const baseTSVFilePath = path.resolve(datapath, `${cc}.tsv`);
    if (fs.existsSync(baseTSVFilePath)) {
      logger.debug(`[postalCityMap] loaded ${baseTSVFilePath}`);
      rows = rows.concat(parse(baseTSVFilePath));
      return true;
    }
  });

  // load override file
  searchPaths.some(datapath => {
    const overrideTSVFilePath = path.resolve(datapath, `${cc}.override.tsv`);
    if (fs.existsSync(overrideTSVFilePath)) {
      logger.debug(`[postalCityMap] loaded ${overrideTSVFilePath}`);
      rows = rows.concat(parse(overrideTSVFilePath, Number.MAX_SAFE_INTEGER));
      return true;
    }
  });

  // generate map
  rows.forEach(row => {
    const postalcode = normalizePostcode(row.postalcode);
    if( !m.hasOwnProperty(postalcode) ){ m[postalcode] = []; }
    m[postalcode].push({
      wofid: row.wofid.replace(/\s/g, ''),
      name: row.name.trim(),
      abbr: row.abbr && row.abbr.length ? row.abbr.trim() : undefined,
      placetype: row.placetype && row.placetype.length ? row.placetype.trim() : undefined,
      weight: row.weight ? parseInt(row.weight, 10) : 0
    });
  });

  // post-processing
  for( var postalcode in m ){

    // remove any invalid records
    m[postalcode] = m[postalcode].filter(alternative => {
      if (!_.isString(alternative.wofid) || _.isEmpty(alternative.wofid)){ return false; }
      if (!_.isString(alternative.name) || _.isEmpty(alternative.name)){ return false; }
      return true;
    });

    // re-sort the records by weight DESC in case they were provided out-of-order
    m[postalcode] = stable(m[postalcode], (a, b) => b.weight - a.weight);

    // remove duplicate WOFID entries (favour the higher weighted duplicate)
    m[postalcode] = _.uniqBy(m[postalcode], 'wofid');
  }

  return m;
}

// TSV file parser
function parse(filepath, defaultWeight){
  const contents = fs.readFileSync(filepath, 'UTF8');
  const lines = csv(contents, tsvOptions);

  return lines.filter(line => {
    // ensure the 3 mandatory columns are present
    // note: some editors convert tabs to spaces
    if( !line.postalcode.length || !line.wofid.length || !line.name.length ){
      console.error(`postal city config: invalid TSV line, must use tabs!`, line);
      return false;
    }
    return true;
  }).map(line => {
    // optionally assign a default 'weight' for rows which do how have a weight assigned.
    if( !line.weight && defaultWeight ){ line.weight = defaultWeight; }
    return line;
  });
}

// perform some normalization in order to match records where only a trivial difference exists
function normalizePostcode(postcode, isocode){

  // remove any USA state prefix and truncate ZIP+4 codes. EG. 'CA 94610-2737'
  if(USA_ISO_CODES.includes(isocode)){
    const match = postcode.match(/\d{5}/);

    // return first sequence of 5 consecutive digits
    if( match && match.length ){ return match[0]; }

    // fallback, remove the ZIP+4 and non-numeric characters and then truncate at 5 digits
    return postcode.replace(/-.*$/,'').replace(/\D/g,'').substr(0,5);
  }

  return postcode.toUpperCase().replace(/\s/g, '');
}

// a convenience function which performs fast lookups on the data
module.exports.lookup = function( isocode, postalcode ){
  if( !tables.hasOwnProperty(isocode) ){ return null; }

  // normalize postalcode
  postalcode = normalizePostcode(postalcode, isocode);

  if( !tables[isocode].hasOwnProperty(postalcode) ){ return null; }
  return tables[isocode][postalcode];
};
