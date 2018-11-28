const tape = require('tape');
const childProcess = require( 'child_process' );
const path = require('path');
const temp = require('temp').track();
const fs = require('fs');
const EOL = require('os').EOL;
const _ = require('lodash');

tape('worker tests', (test) => {
  test.test('requested lat/lon inside a polygon should return that record\'s hierarchy', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-test_layer-latest.csv'),
        `id,name,path${EOL}123,place name,record.geojson${EOL}`);

      // setup a WOF record
      const record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '-1,-1,1,1',
          'geom:latitude': 0.5,
          'geom:longitude': 0.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              layer1_id: 11,
              layer2_id: 13
            }
          ],
          'wof:id': 17,
          'wof:name': 'record name',
          'wof:placetype': 'record placetype'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[1,-1],[-1,-1],[-1,1],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write it to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'record.geojson'), JSON.stringify(record));

      // for a worker process
      const worker = childProcess.fork(path.join('src', 'pip', 'worker'), ['test_layer', temp_dir]);

      worker.on('message', msg => {
        // when a 'loaded' message is received, send a 'search' request for a lat/lon
        if (msg.type === 'loaded') {
          t.equals(msg.layer, 'test_layer', 'the worker should respond with its requested layer');
          t.ok(_.isFinite(msg.seconds), 'time to load should have been returned');
          t.equals(_.size(msg.data), 1, 'a summary of the WOF data should be returned in the message');

          // in this case the lat/lon is inside the known polygon
          worker.send({
            type: 'search',
            id: 'test request id',
            coords: {
              latitude: 0.5,
              longitude: -0.5
            }
          });

        } else if (msg.type === 'results') {
          // when the 'results' message is received, make some assertions and kill the worker
          temp.cleanupSync();

          t.deepEquals(msg, {
            id: 'test request id',
            type: 'results',
            layer: 'test_layer',
            results: {
              Id: 17,
              Hierarchy: [ [11, 13] ]
            }
          }, 'the hierarchy of the WOF record should be returned');

          t.ok(worker.kill(), 'the worker should be killed');
          t.end();

        }

      });

    });

  });

  test.test('requested lat/lon outside any polygons should return empty results', t => {
    temp.mkdir('tmp_wof_data', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'data'));
      fs.mkdirSync(path.join(temp_dir, 'meta'));

      // write out the WOF meta file with the minimum required fields
      fs.writeFileSync(
        path.join(temp_dir, 'meta', 'whosonfirst-data-test_layer-latest.csv'),
        `id,name,path${EOL}123,place name,record.geojson${EOL}`);

      // setup a WOF record
      const record = {
        id: 123,
        type: 'Feature',
        properties: {
          'geom:bbox': '-1,-1,1,1',
          'geom:latitude': 0.5,
          'geom:longitude': 0.5,
          'mz:hierarchy_label': 1,
          'wof:hierarchy': [
            {
              layer1_id: 11,
              layer2_id: 13
            }
          ],
          'wof:id': 17,
          'wof:name': 'record name',
          'wof:placetype': 'record placetype'
        },
        geometry: {
          coordinates: [
            [
              [1,1],[1,-1],[-1,-1],[-1,1],[1,1]
            ]
          ],
          type: 'Polygon'
        }
      };

      // and write it to file
      fs.writeFileSync(path.join(temp_dir, 'data', 'record.geojson'), JSON.stringify(record));

      const worker = childProcess.fork(path.join('src', 'pip', 'worker'), ['test_layer', temp_dir]);

      worker.on('message', msg => {
        // when a 'loaded' message is received, send a 'search' request for a lat/lon
        if (msg.type === 'loaded') {
          t.equals(msg.layer, 'test_layer', 'the worker should respond with its requested layer');
          t.equals(_.size(msg.data), 1, 'a summary of the WOF data should be returned in the message');
          t.ok(_.isFinite(msg.seconds), 'time to load should have been returned');

          // in this case the lat/lon is outside of any known polygons
          worker.send({
            type: 'search',
            id: 'test request id',
            coords: {
              latitude: 1.5,
              longitude: -1.5
            }
          });

        } else if (msg.type === 'results') {
          // when the 'results' message is received, make some assertions and kill the worker
          temp.cleanupSync();

          t.deepEquals(msg, {
            id: 'test request id',
            type: 'results',
            layer: 'test_layer',
            results: {}
          }, 'no results should be returned');

          t.ok(worker.kill(), 'the worker should be killed');
          t.end();

        }

      });

    });

  });

});
