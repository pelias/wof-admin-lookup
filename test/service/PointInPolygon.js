const tape = require('tape');

const PointInPolygon = require('../../src/service/PointInPolygon');

tape('PointInPolygon service configuration tests', (test) => {
  test.test('getUrl should return value formatted with point.lon/lat passed to constructor', (t) => {
    const config = {
      url: 'http://localhost:4100'
    };

    const pointInPolygon = new PointInPolygon(config);

    const params = {
      lat: 5,
      lon: 6
    };

    t.equals(pointInPolygon.getUrl(params), 'http://localhost:4100/6/5');
    t.end();
  });

  test.test('getUrl should remove extra slashes', (t) => {
    const config = {
      url: 'http://localhost:4100/'
    };

    const pointInPolygon = new PointInPolygon(config);

    const params = {
      lat: 5,
      lon: 6
    };

    t.equals(pointInPolygon.getUrl(params), 'http://localhost:4100/6/5');
    t.end();
  });
});
