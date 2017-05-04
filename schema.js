const Joi = require('joi');
const cpus = require('os').cpus;

module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    adminLookup: Joi.object().keys({
      // default maxConcurrentReqs to # of cpus/cores * 10
      maxConcurrentReqs: Joi.number().integer().default(cpus().length*10),
      enabled: Joi.boolean().default(true)
    }).unknown(true),
    whosonfirst: Joi.object().keys({
      datapath: Joi.string()
    }).requiredKeys('datapath').unknown(true)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);
