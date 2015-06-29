var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var wikipedia = require('entipic.topic').wikipedia;

external.explore = function(names) {
  return Promise.resolve(names).map(function(name) {
    var topic = {
      name: name
    };
    return internal.topic(topic);
  }, {
    concurrency: 2
  });
};

internal.topic = function(topic, lang) {
  var name = topic.name;
  return wikipedia.topic.info(topic.name.lang, topic.name.name)
    .then(function(info) {
      if (!info) {
        if (name.lang !== 'en') {
          lang = name.lang;
          name.lang = 'en';
          return internal.topic(topic, lang);
        }
        if (lang) name.lang = lang;
        return topic;
      }

      name.title = info.title;

      topic.title = info.title;
      topic.description = info.description;
      topic.url = info.url;

      return wikipedia.topic.explore(name.lang, topic.title)
        .then(function(result) {
          result.name = name;

          if (result.langlinks || name.lang === 'en') {
            var eng = result.langlinks && _.find(result.langlinks, {
              lang: 'en'
            });
            if (name.lang === 'en') {
              eng = {
                title: result.title
              };
            }
            if (eng) {
              return wikipedia.topic.type(eng.title)
                .then(function(type) {
                  result.type = type;
                  return result;
                }).catch(function() {
                  return result;
                });
            }
          }

          return result;
        });
    }).catch(function() {
      if (name.lang !== 'en') {
        lang = name.lang;
        name.lang = 'en';
        return internal.topic(topic, lang);
      }
      if (lang) name.lang = lang;
      return topic;
    });
};
