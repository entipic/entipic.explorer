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
  options.type = options.type || 'photo';
  var url = 'https://{host}/search?q={q}&hl={lang}&prmd=imvnslo&source=lnms&tbm=isch&tbas=0&tbs=itp:{type},isz:lt,islt:qsvga&safe=on';
  var host = utils.getGoogleHost(country);
  url = url.replace('{q}', encodeURIComponent(name));
  url = url.replace('{host}', host)
    .replace('{lang}', lang || 'en')
    .replace('{type}', options.type);

  var regOptions = {
    url: url,
    headers: {
      'User-Agent': utils.USER_AGENT
    }
  };

  return utils.request(regOptions).then(function(page) {
    page = cheerio.load(page);

    var list = [];

    page('div.rg_di.rg_el.ivg-i a', 'body').each(function(index, item) {
      var href = page(item).attr('href');
      if (index >= options.limit) return;
      href = Qs.parse(Url.parse(href).query).imgurl;
      if (!href) return;
      list.push(href);
    });

    return list;
  });
};
