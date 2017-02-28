const path = require('path');
const fs = require('fs');
const parallelStream = require('pelias-parallel-stream');

const maxInFlight = 10;

module.exports.create = (datapath) => {
  return parallelStream(maxInFlight, function(record, enc, next) {
    const filename = [ datapath, 'data', record.path ].join(path.sep);
    fs.readFile(filename, (err, data) => {
      if (err) {
        console.error(`exception reading file ${filename}`);
        next(err);
      } else {
        try {
          const object = JSON.parse(data);
          next(null, object);
        } catch (parse_err) {
          console.error(`exception parsing JSON in file ${record.path}: ${parse_err}`);
          console.error('Inability to parse JSON usually means that WOF has been cloned ' +
                        'without using git-lfs, please see instructions here: ' +
                        'https://github.com/whosonfirst/whosonfirst-data#git-and-large-files');
          next(parse_err);
        }
      }
    });
  });

};
