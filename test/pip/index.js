const tape = require('tape');
const path = require('path');
const temp = require('temp');
const fs = require('fs');
const EOL = require('os').EOL;
const _ = require('lodash');
const proxyquire = require('proxyquire').noCallThru();
const generateWOFDB = require('pelias-whosonfirst/test/generateWOFDB');

const pip = require('../../src/pip/index');

tape('PiP tests', test => {
  test.test('empty array should be returned when search_layers is empty even if lat/lon is in a polygon', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta files with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write it to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));

      const service = pip.create(temp_dir, ['neighbourhood'], false, (err, o) => {
        // do a lookup that specifies empty layers
        o.lookup(0.5, 0.5, [], (err, results) => {
          t.deepEquals(results, [], 'no results should have been returned');
          // must be explicitly ended or the test hangs
          o.end();
          t.end();
        });

      });

    });

  });

  test.test('requested lat/lon inside a neighbourhood polygon should return only neighbourhood', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta files with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that doesn't contain the lookup point to
      // show that hierarchy is used to establish the response
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '3,3,4,4',
          'geom:latitude': 3.5,
          'geom:longitude': 3.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [3,3],[3,4],[4,4],[4,3],[3,3]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const service = pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, o) => {
        // lookup of point that only hits neighbourhood will NOT return borough
        o.lookup(1.5, 1.5, undefined, (err, results) => {
          t.deepEquals(results, [
            {
              Id: 123,
              Name: 'neighbourhood name',
              Placetype: 'neighbourhood',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,2,2',
              Hierarchy: [ [ 123, 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          o.end();
          t.end();
        });

      });

    });

  });

  test.test('requested lat/lon inside a neighbourhood and parent borough should return full hierarchy', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta files with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,4,4',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[4,1],[4,4],[1,4],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that doesn't contain the lookup point to
      // show that hierarchy is used to establish the response
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '3,3,4,4',
          'geom:latitude': 3.5,
          'geom:longitude': 3.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [3,3],[3,4],[4,4],[4,3],[3,3]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const service = pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, o) => {
        // lookup of point that only hits neighbourhood will NOT return borough
        o.lookup(3.5, 3.5, undefined, (err, results) => {
          t.deepEquals(results, [
            {
              Id: 123,
              Name: 'neighbourhood name',
              Placetype: 'neighbourhood',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,4,4',
              Hierarchy: [ [ 123, 456 ] ]
            },
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 3.5,
                lon: 3.5
              },
              BoundingBox: '3,3,4,4',
              Hierarchy: [ [ 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          o.end();
          t.end();
        });

      });

    });

  });

  test.test('querying for only neighbourhood layer should work fine', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta files with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,4,4',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[4,1],[4,4],[1,4],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that doesn't contain the lookup point to
      // show that hierarchy is used to establish the response
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '3,3,4,4',
          'geom:latitude': 3.5,
          'geom:longitude': 3.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [3,3],[3,4],[4,4],[4,3],[3,3]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const service = pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, o) => {
        // lookup of point that only hits neighbourhood will NOT return borough
        o.lookup(3.5, 3.5, ['neighbourhood'], (err, results) => {
          t.deepEquals(results, [
            {
              Id: 123,
              Name: 'neighbourhood name',
              Placetype: 'neighbourhood',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,4,4',
              Hierarchy: [ [ 123, 456 ] ]
            },
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 3.5,
                lon: 3.5
              },
              BoundingBox: '3,3,4,4',
              Hierarchy: [ [ 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          o.end();
          t.end();
        });

      });

    });

  });

  test.test('first layer not containing the point should fallback to other layers', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta files with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that doesn't contain the lookup point to
      // show that hierarchy is used to establish the response
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '3,3,4,4',
          'geom:latitude': 3.5,
          'geom:longitude': 3.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [3,3],[3,4],[4,4],[4,3],[3,3]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const service = pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, o) => {
        o.lookup(3.5, 3.5, undefined, (err, results) => {
          t.deepEquals(results, [
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 3.5,
                lon: 3.5
              },
              BoundingBox: '3,3,4,4',
              Hierarchy: [ [ 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          o.end();
          t.end();
        });

      });

    });

  });

  test.test('no layer containing the point should return an empty array', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that doesn't contain the lookup point
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '3,3,4,4',
          'geom:latitude': 3.5,
          'geom:longitude': 3.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [3,3],[3,4],[4,4],[4,3],[3,3]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, service) => {
        service.lookup(10, 10, undefined, (err, results) => {
          t.deepEquals(results, []);
          // must be explicitly ended or the test hangs
          service.end();
          t.end();
        });

      });

    });

  });

  test.test('explicit layers should skip unincluded layers', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        `id,name,path${EOL}123,place name,neighbourhood_record.geojson${EOL}`);
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a neighbourhood WOF record
      // this has the same geometry as the borough record to show that it will be skipped
      const neighbourhood_record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 123,
          'wof:name': 'neighbourhood name',
          'wof:placetype': 'neighbourhood'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // setup a borough WOF record that's the exact same geometry as neighbourhood
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              borough_id: 456
            }
          ],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), JSON.stringify(neighbourhood_record));
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, service) => {
        service.lookup(1.5, 1.5, ['borough'], (err, results) => {
          t.deepEquals(results, [
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,2,2',
              Hierarchy: [ [ 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          service.end();
          t.end();
        });

      });

    });

  });

  test.test('only layers specified by create should be loaded and should not be checked', t => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-neighbourhood-latest.csv'),
        'this is not a valid WOF meta file');
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a borough WOF record that's the exact same geometry as neighbourhood
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              locality_id: 123,
              region_id: 456
            }
          ],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'neighbourhood_record.geojson'), 'this isn\'t JSON');
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const pip = proxyquire('../../src/pip/index', {
        'pelias-logger': logger
      });

      // load only the neighbourhood layer
      pip.create(temp_dir, ['borough'], false, (err, service) => {
        t.notOk(logger.isInfoMessage(/neighbourhood worker loaded .+/));
        t.ok(logger.isInfoMessage(/borough worker loaded 1 features in \d+\.\d+ seconds/));

        // but request both neighbourhood and borough layers
        service.lookup(1.5, 1.5, ['neighbourhood', 'borough'], (err, results) => {
          t.deepEquals(results, [
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,2,2',
              Hierarchy: [ [ 123, 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          service.end();
          t.end();
        });

      });

    });

  });

  test.test('no layers specified for create should load all layers', t => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      [
        'neighbourhood', 'borough', 'locality', 'localadmin', 'county',
        'macrocounty', 'region', 'macroregion', 'dependency', 'country', 'empire',
        'continent', 'marinearea', 'ocean'].forEach(layer => {
          fs.writeFileSync(
            path.join(temp_dir, 'meta', `whosonfirst-data-${layer}-latest.csv`), `id,name,path${EOL}`);
        });

      const pip = proxyquire('../../src/pip/index', {
        'pelias-logger': logger
      });

      // don't specify layers so all are loaded
      pip.create(temp_dir, undefined, false, (err, service) => {
        t.ok(logger.isInfoMessage(/neighbourhood worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/borough worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/locality worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/localadmin worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/county worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/macrocounty worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/region worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/macroregion worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/dependency worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/country worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/empire worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/continent worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/marinearea worker loaded 0 features in \d+\.\d+ seconds/));
        t.ok(logger.isInfoMessage(/ocean worker loaded 0 features in \d+\.\d+ seconds/));

        t.equals(logger.getInfoMessages().pop(), 'PIP Service Loading Completed!!!');

        service.end();
        t.end();

      });

    });

  });

  test.test('layers missing metafiles when not fatal should report error and skip lookup at those layers', t => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a borough WOF record that's the exact same geometry as neighbourhood
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              borough_id: 456
            }
          ],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const pip = proxyquire('../../src/pip/index', {
        'pelias-logger': logger
      });

      // initialize PiP with neighbourhood/locality (that don't exist) and borough (which does exist)
      pip.create(temp_dir, ['neighbourhood', 'borough'], false, (err, service) => {
        t.deepEquals(logger.getWarnMessages(), [
          'unable to locate ' + path.join(temp_dir, 'meta', `whosonfirst-data-neighbourhood-latest.csv`)
        ]);

        service.lookup(1.5, 1.5, undefined, (err, results) => {
          t.deepEquals(results, [
            {
              Id: 456,
              Name: 'borough name',
              Placetype: 'borough',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              BoundingBox: '1,1,2,2',
              Hierarchy: [ [ 456 ] ]
            }
          ]);
          // must be explicitly ended or the test hangs
          service.end();
          t.end();
        });

      });

    });

  });

  test.test('layers missing metafiles when fatal should return error on callback', t => {
    const logger = require('pelias-mock-logger')();

    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-borough-latest.csv'),
        `id,name,path${EOL}456,borough name,borough_record.geojson${EOL}`);

      // setup a borough WOF record that's the exact same geometry as neighbourhood
      const borough_record = {
        id: 456,
        type: 'Feature',
        properties: {
          'geom:bbox': '1,1,2,2',
          'geom:latitude': 1.5,
          'geom:longitude': 1.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              borough_id: 456
            }
          ],
          'wof:id': 456,
          'wof:name': 'borough name',
          'wof:placetype': 'borough'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[2,1],[2,2],[1,2],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write the records to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'borough_record.geojson'), JSON.stringify(borough_record));

      const pip = proxyquire('../../src/pip/index', {
        'pelias-logger': logger,
        'pelias-config': {
          generate: () => {
            return {
              imports: {
                adminLookup: {
                  missingMetafilesAreFatal: true
                },
                whosonfirst: { }
              }
            };
          }
        }
      });

      // initialize PiP with neighbourhood (that doesn't exist) and borough (which does exist)
      pip.create(temp_dir, ['neighbourhood', 'borough', 'locality'], false, (err, service) => {
        t.deepEquals(logger.getErrorMessages(), [
          'unable to locate ' + path.join(temp_dir, 'meta', `whosonfirst-data-neighbourhood-latest.csv`),
          'unable to locate ' + path.join(temp_dir, 'meta', `whosonfirst-data-locality-latest.csv`)
        ], 'should have an error message');

        t.deepEquals(err, `unable to locate meta files in ${path.join(temp_dir, 'meta')}` +
          ': whosonfirst-data-neighbourhood-latest.csv, whosonfirst-data-locality-latest.csv');
        t.notOk(service);
        t.end();

      });

    });

  });

  test.test('Should load SQLite when option is activated', t => {
    const logger = require('pelias-mock-logger')();
    const defaultGeom = {
      coordinates: [
        [
          [1,1],[2,1],[2,2],[1,2],[1,1]
        ]
      ],
      type: 'Polygon'
    };
    temp.mkdir('tmp_wof_sqlite', (err, temp_dir) => {
      generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-latest.db'), [
        {
          id: 0,
          properties: {
            'wof:id': 0,
            'wof:name': 'null island',
            'wof:placetype': 'country',
            'geom:latitude': 0,
            'geom:longitude': 0,
            'edtf:deprecated': 0,
            'wof:superseded_by': []
          },
          geometry: defaultGeom
        },
        {
          id: 421302191,
          'wof:placetype': 'region',
          properties: {
            'wof:id': 421302191,
            'wof:name': 'name 421302191',
            'wof:placetype': 'region',
            'geom:latitude': 1.5,
            'geom:longitude': 1.5,
            'wof:superseded_by': []
          },
          geometry: defaultGeom
        },
        {
          id: 421302147,
          properties: {
            'wof:id': 421302147,
            'wof:name': 'name 421302147',
            'wof:placetype': 'region',
            'geom:latitude': 1.5,
            'geom:longitude': 1.5,
            'wof:superseded_by': ['421302191']
          },
          geometry: defaultGeom
        },
        {
          id: 421302897,
          properties: {
            'wof:id': 421302897,
            'wof:placetype': 'locality',
            'geom:latitude': 1.5,
            'geom:longitude': 1.5,
            'wof:superseded_by': []
          },
          geometry: defaultGeom
        }
      ]);
      
      const config = { imports: { adminLookup: {}, whosonfirst: { sqlite: true } } };
      const configFilename = path.join(temp_dir, 'config.json');
      const pip = proxyquire('../../src/pip/index', {
        'pelias-logger': logger,
        'pelias-config': {
          generate: () => {
            return config;
          }
        }
      });

      // Override env because proxyquire can't be used in child_process
      fs.writeFileSync(configFilename, JSON.stringify(config));
      process.env.PELIAS_CONFIG = configFilename;

      pip.create(temp_dir, ['country', 'region', 'locality'], false, (err, service) => {
        t.ok(service);
        service.lookup(1.5, 1.5, undefined, (err, results) => {
          t.deepEquals(results, [
            {
              Id: 421302191,
              Name: 'name 421302191',
              Placetype: 'region',
              Centroid: {
                lat: 1.5,
                lon: 1.5
              },
              Hierarchy: [ [ 421302191 ] ]
            }
          ]);
          service.end();
          delete process.env.PELIAS_CONFIG;
          t.end();
        });
      });
    });
  });

});
