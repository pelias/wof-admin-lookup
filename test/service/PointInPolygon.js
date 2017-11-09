const tape = require('tape');

const PointInPolygon = require('../../src/service/PointInPolygon');

// basic configuration used in all tests
const config = {
  url: 'http://localhost:4100'
};

tape('PointInPolygon service configuration tests', (test) => {
  test.test('getUrl should return value formatted with point.lon/lat passed to constructor', (t) => {
    const pointInPolygon = new PointInPolygon(config);

    const params = {
      lat: 5,
      lon: 6
    };

    t.equals(pointInPolygon.getUrl(params), 'http://localhost:4100/6/5');
    t.end();
  });

  test.test('getUrl should remove extra slashes', (t) => {
    const pointInPolygon = new PointInPolygon(config);

    const params = {
      lat: 5,
      lon: 6
    };

    t.equals(pointInPolygon.getUrl(params), 'http://localhost:4100/6/5');
    t.end();
  });

  test.test('getParameters should return all land laters by default', (t) => {
    const pointInPolygon = new PointInPolygon(config);

    const expectedParams = {
      layers: [ 'neighbourhood', 'borough', 'locality', 'localadmin', 'county',
                'macrocounty', 'region', 'macroregion', 'dependency', 'country' ]
    };

    t.deepEquals(pointInPolygon.getParameters(), expectedParams);
    t.end();
  });

  test.test('passing layers to constructor should return a filtered list of layers', (t) => {
    const inputLayers = ['borough',
                         'localadmin',
                         'ocean' //will be filtered out
                        ];
    const pointInPolygon = new PointInPolygon(config, inputLayers);

    const expectedParams = {
      layers: ['borough', 'localadmin']
    };

    t.deepEquals(pointInPolygon.getParameters(inputLayers), expectedParams);
    t.end();
  });
});
