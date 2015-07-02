var cheerio = require('cheerio');
var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var utils = require('../utils');
var external = module.exports;
var internal = {};

external.search = function(name, lang, country) {
  var options = {
    url: 'https://www.google.com/search',
    gzip: true,
    qs: {
      //hl: 'en',
      lr: 'lang_' + lang,
      q: name
    },
    headers: {
      'User-Agent': utils.USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8,cs;q=0.6,es;q=0.4,hu;q=0.2,it;q=0.2,lt;q=0.2,ro;q=0.2,ru;q=0.2,sk;q=0.2,uk;q=0.2,pl;q=0.2,bg;q=0.2'
    }
  };
  if (country) {
    options.qs.cr = 'country' + country.toUpperCase();
  }

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
  stats = stats.replace(/ /g, ' ');

  var result = /(\d[\d,\. ]*)/.exec(stats);
  if (!result) return;

  //console.log('reg', result);

  return parseInt(result[1].replace(/[\., ]/g, ''));
};
