const tape = require('tape');
const proxyquire = require('proxyquire');

tape('postalCityMap tests', (test) => {
  test.test('disabled postcodes - filters all rows when postcode is disabled', (t) => {
    // Test TSV where postcode "12345" has a valid row AND a disabled marker row
    const tsvContent = `12345\t101\tCity A\tCA\tlocality\t100
12345\t-\t-
67890\t102\tCity B\tCB\tlocality\t100
11111\t103\tCity C\tCC\tlocality\t100`;

    const postalCityMap = proxyquire('../src/postalCityMap', {
      'fs': {
        existsSync: (path) => path.endsWith('USA.tsv'),
        readFileSync: () => tsvContent
      }
    });

    // Should not find postcode 12345 (disabled even though it has valid row)
    const disabledResult = postalCityMap.lookup('USA', '12345');
    t.notOk(disabledResult, 'should not find disabled postcode 12345');

    // Should find other valid postcodes
    const result1 = postalCityMap.lookup('USA', '67890');
    t.ok(result1, 'should find valid postcode 67890');
    t.equal(result1[0].name, 'City B', 'should return City B');

    const result2 = postalCityMap.lookup('USA', '11111');
    t.ok(result2, 'should find valid postcode 11111');
    t.equal(result2[0].name, 'City C', 'should return City C');

    t.end();
  });

  test.test('disabled postcodes - all rows with disabled postcode are filtered', (t) => {
    // Test TSV where postcode "99999" appears multiple times and is marked as disabled
    const tsvContent = `99999\t201\tDuplicate City 1\tDC1\tlocality\t100
99999\t202\tDuplicate City 2\tDC2\tlocality\t90
99999\t-\t-
12345\t101\tCity A\tCA\tlocality\t100`;

    const postalCityMap = proxyquire('../src/postalCityMap', {
      'fs': {
        existsSync: (path) => path.endsWith('USA.tsv'),
        readFileSync: () => tsvContent
      }
    });

    // Should not find postcode 99999 (disabled)
    const result = postalCityMap.lookup('USA', '99999');
    t.notOk(result, 'should not find postcode 99999 (all rows filtered)');

    // Should find valid postcode
    const validResult = postalCityMap.lookup('USA', '12345');
    t.ok(validResult, 'should find valid postcode 12345');
    t.equal(validResult[0].name, 'City A', 'should return City A');

    t.end();
  });
});
