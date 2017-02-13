'use strict';

const tape = require( 'tape' );
const Joi = require('joi');
const schema = require( '../schema' );

function validate(config) {
  Joi.validate(config, schema, (err) => {
    if (err) {
      throw new Error(err.details[0].message);
    }
  });
}

tape('test configuration scenarios', function(test) {
  test.test('missing imports should throw error', function(t) {
    const config = {};

    t.throws(validate.bind(null, config), /"imports" is required/);
    t.end();

  });

  test.test('non-object imports should throw error', function(t) {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = { imports: value };

      t.throws(validate.bind(null, config), /"imports" must be an object/);
    });

    t.end();

  });

  test.test('missing imports.whosonfirst should throw error', function(t) {
    const config = {
      imports: {}
    };

    t.throws(validate.bind(null, config), /"whosonfirst" is required/);
    t.end();

  });

  test.test('missing imports.whosonfirst.datapath should throw error', function(t) {
    const config = {
      imports: {
        whosonfirst: {}
      }
    };

    t.throws(validate.bind(null, config), /"datapath" is required/);
    t.end();

  });

  test.test('missing imports.adminLookup should not throw error', function(t) {
    const config = {
      imports: {
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(validate.bind(null, config));
    t.end();

  });

  test.test('non-object imports.adminLookup should throw error', function(t) {
    [null, 17, 'string', [], true].forEach((value) => {
      const config = {
        imports: {
          adminLookup: value,
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.throws(validate.bind(null, config), /"adminLookup" must be an object/);
    });

    t.end();

  });

  test.test('non-number imports.adminLookup.maxConcurrentReqs should throw error', function(t) {
    [null, 'string', {}, [], true].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.throws(validate.bind(null, config), /"maxConcurrentReqs" must be a number/);

    });

    t.end();

  });

  test.test('non-integer imports.adminLookup.maxConcurrentReqs should throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17.3
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.throws(validate.bind(null, config), /"maxConcurrentReqs" must be an integer/);
    t.end();

  });

  test.test('missing imports.adminLookup.maxConcurrentReqs should not throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(validate.bind(null, config));
    t.end();

  });

  test.test('non-boolean imports.adminLookup.enabled should throw error', function(t) {
    [null, 'string', {}, [], 17].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            enabled: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.throws(validate.bind(null, config), /"enabled" must be a boolean/);

    });

    t.end();

  });

  test.test('boolean imports.adminLookup.enabled should not throw error', function(t) {
    [true, false].forEach((value) => {
      const config = {
        imports: {
          adminLookup: {
            maxConcurrentReqs: 17,
            enabled: value
          },
          whosonfirst: {
            datapath: 'datapath value'
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));

    });

    t.end();

  });

  test.test('integer imports.adminLookup.maxConcurrentReqs should not throw error', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17
        },
        whosonfirst: {
          datapath: 'datapath value'
        }
      }
    };

    t.doesNotThrow(validate.bind(null, config));
    t.end();

  });

  test.test('non-string imports.whosonfirst.datapath should throw error', function(t) {
    [null, 17, {}, [], true].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"datapath" must be a string/);
    });

    t.end();

  });

  test.test('unknown properties should not throw errors', function(t) {
    const config = {
      imports: {
        adminLookup: {
          maxConcurrentReqs: 17,
          unknown_property: 'property value'
        },
        whosonfirst: {
          datapath: 'datapath value',
          unknown_property: 'property value'
        },
        unknown_property: 'property value'
      },
      unknown_property: 'property value'
    };

    t.doesNotThrow(validate.bind(null, config));
    t.end();

  });

});
