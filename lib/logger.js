'use strict';

const logger = module.exports = exports = require('winston');

exports.loggly = function loggly(options) {
 options = options || {};
 require('winston-loggly');
 const target = options.logger || logger;

 target.add(logger.transports.Loggly, {
   level: options.level || process.env.LOGGLY_LEVEL || 'warn',
   subdomain: process.env.LOGGLY_DOMAIN,
   inputToken: process.env.LOGGLY_TOKEN,
   tags: options.tags,
   json: options.json
 });
};

exports.removeConsole = function removeConsole(target) {
 target = target || logger;
 return target.remove(logger.transports.Console);
};


if (process.env.NODE_ENV === 'production') {
 logger.loggly({
   tags: ['entipic', 'entipic-explorer', 'app'],
   json: true
 });
 logger.removeConsole();
}
