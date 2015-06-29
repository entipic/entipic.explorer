var cheerio = require('cheerio');
var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var utils = require('../utils');
// var Text = require('entipic.text');
var external = module.exports;
var internal = {};

external.search = function(name, lang, country) {
  var options = {
    url: 'https://' + utils.getGoogleHost(country) + '/search',
    qs: {
      hl: lang,
      q: name
    },
    headers: {
      'User-Agent': utils.USER_AGENT
    }
  };

  return utils.request(options).then(function(page) {
    page = cheerio.load(page);

    var result = {
      popularity: internal.getPopularity(page),
      spell: internal.getSpell(page)
    };

    return result;
  });
};


internal.getSpell = function(page) {
  return page('.card-section a.spell', 'body').text();
};

internal.getPopularity = function(page) {
  var stats = page('#resultStats', 'body').text();
  //console.log('stats', stats);
  if (!stats) return;

  var result = /(\d[\d,\. ]*)/.exec(stats);
  if (!result) return;

  //console.log('reg', result);

  return parseInt(result[1].replace(/[\., ]/g, ''));
};
