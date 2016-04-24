'use strict';

/**
 * Search for images on google
 *
 */

var cheerio = require('cheerio');
var utils = require('../utils');
var Url = require('url');
var Qs = require('qs');
var external = module.exports;

external.search = function(name, lang, country, options) {
	options = options || {};
	options.limit = options.limit || 2;
	//options.type = options.type || 'photo';
	var url = 'https://www.google.com/search?q={q}&lr=&cr={country}&prmd=imvnslo&source=lnms&tbm=isch&tbas=0&tbs=itp:{type},isz:lt,islt:qsvga,ift:jpg&safe=on';
	var host = utils.getGoogleHost(country);
	url = url.replace('{q}', encodeURIComponent(name));
	url = url.replace('{host}', host)
		//.replace('{lang}', lang || 'en')
		.replace('{type}', options.type || '');

	if (country) {
		url = url.replace('{country}', 'country' + country.toUpperCase());
	} else {
		url = url.replace('{country}', '');
	}

	// console.log('image url', url);

	var reqOptions = {
		url: url,
		gzip: true,
		headers: {
			'User-Agent': utils.USER_AGENT,
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.8,cs;q=0.6,es;q=0.4,hu;q=0.2,it;q=0.2,lt;q=0.2,ro;q=0.2,ru;q=0.2,sk;q=0.2,uk;q=0.2,pl;q=0.2,bg;q=0.2'
		}
	};

	return utils.request(reqOptions).then(function(page) {
		page = cheerio.load(page);

		var list = [];

		var elements = page('div.rg_meta', 'body');
		for (var i = 0; i < elements.length; i++) {
			var json = page(elements[i]).text();
			// console.log(json);
			json = JSON.parse(json);
			var href = json.ou;
			if (list.length >= options.limit) {
				break;
			}
			href = decodeURIComponent(href);
			// console.log('href', href);
			if (href) {
				list.push(href);
			}
		}

		return list;
	});
};
