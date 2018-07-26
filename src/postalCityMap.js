
const fs = require('fs');
const path = require('path');

/**
  This function loads 'Postal City' table files from disk
  in to memory, for fast lookups.

  The table files contain 4 columns delimited by a comma.

  The columns are:
  1. Postal Code
  2. Whosonfirst ID
  3. Locality Name
  4. Locality Abbreviation (where available)

  Mappings for additional countries would be greatly appreciated,
  please open a Pull Request.
**/

const tables = {
  'ASM': loadTable('data/ASM.csv'), // American Samoa
  'GUM': loadTable('data/GUM.csv'), // Guam
  'MNP': loadTable('data/MNP.csv'), // Northern Mariana Islands
  'PRI': loadTable('data/PRI.csv'), // Puerto Rico
  'USA': loadTable('data/USA.csv'), // Unites States of America
  'VIR': loadTable('data/VIR.csv')  // United States Virgin Islands
};

// load the file format in to memory
function loadTable(filepath){
  var m = {};
  const rows = fs.readFileSync(path.resolve(__dirname, filepath), 'UTF8')
                 .trim().split('\n').map(row => row.split(','));
  rows.forEach(row =>{
    const postalcode = row[0].replace(/\s/g, '');
    m[postalcode] = {
      wofid: row[1].replace(/\s/g, ''),
      name: row[2].trim(),
      abbr: row[3].length ? row[3].trim() : undefined
    };
  });
  return m;
}

// a convenience function which performs fast lookups on the data
module.exports.lookup = function( countrycode, postalcode ){
  if( !tables.hasOwnProperty(countrycode) ){ return null; }
  if( !tables[countrycode].hasOwnProperty(postalcode) ){ return null; }

  const locality = tables[countrycode][postalcode];
  if( !locality.wofid.length ){ return null; }
  if( !locality.name.length ){ return null; }
  return locality;
};