'use strict';

const Joi = require('joi');

// requires just `imports.whosonfirst.datapath`
// `imports.adminLookup.maxConcurrentReqs` is optional
const schema = Joi.object().keys({
  imports: Joi.object().keys({
    adminLookup: Joi.object().keys({
      maxConcurrentReqs: Joi.number().integer()
    }),
    whosonfirst: Joi.object().keys({
      datapath: Joi.string()
    }).requiredKeys('datapath').unknown(true)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);

module.exports = {
  validate: function validate(config) {
    Joi.validate(config, schema, { allowUnknown: true }, (err, value) => {
      if (err) {
        throw new Error(err.details[0].message);
      }
    });
  }

};
