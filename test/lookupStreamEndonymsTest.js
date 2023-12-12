const tape = require('tape');
const stream_mock = require('stream-mock');
const Document = require('pelias-model').Document;

const stream = require('../src/lookupStream');

function test_stream(input, testedStream, callback) {
  const reader = new stream_mock.ObjectReadableMock(input);
  const writer = new stream_mock.ObjectWritableMock();
  writer.on('error', (e) => callback(e));
  writer.on('finish', () => callback(null, writer.data));
  reader.pipe(testedStream).pipe(writer);
}

tape('tests', (test) => {
  test.test('endonyms - country - Germany/Deutschland', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'Germany', '85633111', 'DEU');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('country', 'Germany', '85633111', 'DEU')
      .addParent('country', 'Deutschland', '85633111', null); // endonym added

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          country: [{ id: 85633111, name: 'Germany' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { useEndonyms: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'country should have additional endonyms');
        t.end();
      });
    });
  });

  test.test('endonyms - region - North Rhine Westphalia/Nordrhein-Westfalen', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('region', 'North Rhine Westphalia', '85682513', 'NW');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('region', 'North Rhine Westphalia', '85682513', 'NW')
      .addParent('region', 'Nordrhein-Westfalen', '85682513', null) // endonym added
      .addParent('region', 'North Rhine-Westphalia', '85682513', null); // endonym added

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          region: [{ id: 85682513, name: 'North Rhine Westphalia' }]
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { useEndonyms: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'country should have additional endonyms');
        t.end();
      });
    });
  });

  test.test('endonyms - locality - megacity - Rome/Roma', (t) => {
    const inputDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('locality', 'Rome', '101752607')
      .addParent('country', 'Italy', '85633253', 'ITA');

    const expectedDoc = new Document('whosonfirst', 'placetype', '1')
      .setCentroid({ lat: 12.121212, lon: 21.212121 })
      .addParent('locality', 'Rome', '101752607')
      .addParent('locality', 'Roma', '101752607') // endonym added
      .addParent('country', 'Italy', '85633253', 'ITA')
      .addParent('country', 'Italia', '85633253'); // endonym added

    const resolver = {
      lookup: (centroid, search_layers, callback) => {
        const result = {
          locality: [{ id: 101752607, name: 'Rome' }],
          country: [{ id: 85633253, name: 'Italy' }],
        };
        setTimeout(callback, 0, null, result);
      }
    };

    const lookupStream = stream(resolver, { useEndonyms: true });
    t.doesNotThrow(() => {
      test_stream([inputDoc], lookupStream, (err, actual) => {
        t.deepEqual(actual, [expectedDoc], 'locality should have additional endonyms');
        t.end();
      });
    });
  });
});
