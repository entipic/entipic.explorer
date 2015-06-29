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
  return nameSearch.search(name, lang, country).then(function(item) {
    names.push({
      name: name,
      lang: lang,
      country: country,
      popularity: item.popularity,
      type: 'original'
    });

    if (item.spell) {
      names.push({
        name: item.spell,
        lang: lang,
        country: country,
        popularity: item.popularity,
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

    return names;
  });
};


internal.variants = function(name, lang, country) {
  var names = [{
    name: name,
    type: 'original'
  }];

  // if (Text.getCyrillicLanguages().indexOf(lang) > -1) {
  //   console.log('1');
  //   if (!Text.isCyrillic(name)) {
  //     console.log('2');
  //     var cyrillicName;
  //     if (lang === 'uk') cyrillicName = koi8u.decode(name);
  //     else cyrillicName = koi8r.encode(name);
  //     console.log(cyrillicName);
  //     if (cyrillicName !== name) {
  //       names.push({
  //         name: cyrillicName,
  //         type: 'cyrillic'
  //       })
  //     }
  //   }
  // }

  return names;
};
