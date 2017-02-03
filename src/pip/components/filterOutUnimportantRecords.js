var filter = require('through2-filter');

// this returns a filter stream that returns true if a WOF record has a property
//  named `mz:hierarchy_label` that equals the integer 1, false otherwise
// in WOF parlance, the value 1 means that the record is of quality source
//  and belongs to a well-known city
module.exports.create = function create() {
  return filter.obj(function(wofData) {
    return wofData.properties.hasOwnProperty('mz:hierarchy_label') &&
            wofData.properties['mz:hierarchy_label'] === 1;
  });
};
