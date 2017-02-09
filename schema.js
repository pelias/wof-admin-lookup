const Joi = require('joi');

module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    adminLookup: Joi.object().keys({
      maxConcurrentReqs: Joi.number().integer(),
      enabled: Joi.boolean()
    }).unknown(true),
    whosonfirst: Joi.object().keys({
      datapath: Joi.string()
    }).requiredKeys('datapath').unknown(true)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);
