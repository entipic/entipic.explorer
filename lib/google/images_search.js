var cheerio = require('cheerio');
var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var utils = require('../utils');
var Url = require('url');
var Qs = require('qs');
// var Text = require('entipic.text');
var external = module.exports;
var internal = {};

external.search = function(name, lang, country, options) {
  options = options || {};
  options.limit = options.limit || 2;
  //options.type = options.type || 'photo';
  var url = 'https://www.google.com/search?q={q}&lr=&cr={country}&prmd=imvnslo&source=lnms&tbm=isch&tbas=0&tbs=itp:{type},isz:lt,islt:qsvga&safe=on';
  var host = utils.getGoogleHost(country);
  url = url.replace('{q}', encodeURIComponent(name));
  url = url.replace('{host}', host)
    //.replace('{lang}', lang || 'en')
    .replace('{type}', options.type || '');

  if (country) {
    url = url.replace('{country}', 'country' + country.toUpperCase());
  }else{
    url = url.replace('{country}', '');
  }

  console.log('image url', url);

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

    page('div.rg_di.rg_el.ivg-i a', 'body').each(function(index, item) {
      var href = page(item).attr('href');
      if (list.length >= options.limit) return;
      href = Qs.parse(Url.parse(href).query).imgurl;
      if (!href) return;
      if (core.text.endsWith(href, '.png') || core.text.endsWith(href, '.gif') || core.text.endsWith(href, '.html')) return;
      list.push(href);
    });

    return list;
  });
};
