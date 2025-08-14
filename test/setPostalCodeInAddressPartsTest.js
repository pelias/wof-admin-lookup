const tape = require('tape');
const setPostalCodeInAddressParts = require('../src/setPostalCodeInAddressParts');

function createMockDoc(existingZip = null) {
  return {
    addresses: { zip: existingZip },
    centroid: { lat: 40.7128, lon: -74.0060 },

    getAddress: function(field) {
      return this.addresses[field];
    },

    setAddress: function(field, value) {
      this.addresses[field] = value;
    },

    getCentroid: function() {
      return this.centroid;
    }
  };
}

tape('setPostalCodeInAddressParts', function(test) {

  test.test('should not set zip when no postal code data exists', function(t) {
    const doc = createMockDoc();
    const result = {};

    setPostalCodeInAddressParts(result, doc);

    t.equals(doc.getAddress('zip'), null, 'zip should remain null');
    t.end();
  });

  test.test('should not set zip when postal code array is empty', function(t) {
    const doc = createMockDoc();
    const result = { postalcode: [] };

    setPostalCodeInAddressParts(result, doc);

    t.equals(doc.getAddress('zip'), null, 'zip should remain null');
    t.end();
  });

  test.test('should set zip when postal code data exists and no existing zip', function(t) {
    const doc = createMockDoc();
    const result = {
      postalcode: [
        { id: '123456', name: '90210', abbr: null }
      ]
    };

    setPostalCodeInAddressParts(result, doc);

    t.equals(doc.getAddress('zip'), '90210', 'zip should be set to postal code');
    t.end();
  });

  test.test('should not overwrite existing zip code', function(t) {
    const doc = createMockDoc('10001');
    const result = {
      postalcode: [
        { id: '123456', name: '90210', abbr: null }
      ]
    };

    setPostalCodeInAddressParts(result, doc);

    t.equals(doc.getAddress('zip'), '10001', 'existing zip should be preserved');
    t.end();
  });

  test.test('should not set zip when postal code name is missing', function(t) {
    const doc = createMockDoc();
    const result = {
      postalcode: [
        { id: '123456', abbr: null }
      ]
    };

    setPostalCodeInAddressParts(result, doc);

    t.equals(doc.getAddress('zip'), null, 'zip should remain null when name is missing');
    t.end();
  });

});