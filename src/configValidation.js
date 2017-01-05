'use strict';

const Joi = require('joi');

// requires just `maxConcurrentReqs`
const schema = Joi.object().keys({
  imports: {
    adminLookup: {
      maxConcurrentReqs: Joi.number().integer()
    }
  }
}).unknown(true);

module.exports = {
  validate: function validate(config) {
    Joi.validate(config, schema, { allowUnknown: true }, (err, value) => {
      if (err) {
        throw new Error(err.details[0].message);
      }
    });
  }

};
