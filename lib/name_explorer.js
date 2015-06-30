var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
// var Text = require('entipic.text');
var external = module.exports;
var internal = {};
var nameSearch = require('./google/name_search');
// var koi8r = require('koi8-r');
// var koi8u = require('koi8-u');

external.explore = function(name, lang, country) {
  var names = [];
  var minPopularity = 5000;
  return nameSearch.search('"' + name + '"', lang, country).then(function(item) {
    names.push({
      name: name,
      lang: lang,
      country: country,
      popularity: item.popularity,
      type: 'original'
    });

    if (item.spell) {
      names.push({
        name: internal.noQuotes(item.spell),
        lang: lang,
        country: country,
        popularity: item.popularity * 2,
        type: 'spell'
      });
    } else {
      var words = name.split(' ');
      if (words.length === 2) {
        names.push({
          name: words[1] + ' ' + words[0],
          lang: lang,
          country: country,
          popularity: item.popularity,
          type: 'var'
        });
      }
    }

    //console.log('names', names);

    if (!item.spell && item.popularity < minPopularity) return [];

    return names;
  });
};

internal.noQuotes = function(text) {
  return text.substring(1, text.length - 1);
};
