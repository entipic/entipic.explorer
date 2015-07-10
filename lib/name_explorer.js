'use strict';

var external = module.exports;
var internal = {};
var nameSearch = require('./google/name_search');

external.explore = function(name, lang, country) {
  return internal.search(name, lang, country).then(function(names) {
    if (!names || names.length === 0) {
      if (country) {
        return internal.search(name, lang, country, true);
      }
    }
    return names;
  });
};

internal.search = function(name, lang, country, noSearchLang) {
  var names = [];
  var minPopularity = 4000;
  var searchLang = noSearchLang ? null : lang;
  return nameSearch.search(name, searchLang, country).then(function(item) {
    names.push({
      name: name,
      lang: lang,
      country: country,
      popularity: item.popularity,
      type: 'original'
    });

    if (item.spell && item.spell.trim().length > 2) {
      names.push({
        name: item.spell,
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

    if (!item.spell && item.popularity < minPopularity) {
      return [];
    }

    return names;
  });
};

internal.noQuotes = function(text) {
  return text.substring(1, text.length - 1);
};
