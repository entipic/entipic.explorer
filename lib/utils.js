'use strict';

var request = require('request');
var core = require('entipic.core');
var Promise = core.Promise;

var external = module.exports;

external.request = function(options) {
	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (error || response.statusCode !== 200) {
				return reject(error || new Error('Invalid status code: ' + response.statusCode));
			}
			//console.log('response', response.req);
			resolve(body);
		});
	});
};

external.requestImage = function(options) {
	return new Promise(function(resolve, reject) {
		request(options, function(error, response, body) {
			if (error || response.statusCode !== 200) {
				return reject(error || new Error('Invalid status code: ' + response.statusCode));
			}
			var contentType = response.headers['content-type'];
			if (contentType !== 'image/jpeg') {
				return reject(new Error('Invalid image format: ' + contentType));
			}
			resolve(body);
		});
	});
};

var GOOGLE_HOST_CODES = {
	gb: 'co.uk',
	uk: 'co.uk'
};

external.getGoogleHost = function(country) {
	if (!country) {
		country = 'com';
	}

	country = GOOGLE_HOST_CODES[country] || country;

	return 'www.google.' + country;
};

external.USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36';
