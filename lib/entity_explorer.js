var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var wikipedia = require('entipic.entity').wikipedia;

external.explore = function(names) {
  return Promise.resolve(names).map(function(name) {
      var entity = {
        name: name
      };
      return internal.entity(entity);
    }, {
      concurrency: 2
    })
    .then(internal.filterEntities)
    .catch(function(error) {
      core.logger.error('Error on processing names: ' + JSON.stringify(names), error);
    });
};

internal.filterEntities = function(entities) {
  entities = _.sortBy(entities, function(entity) {
    if (entity.name.type === 'original') return 0;
    if (entity.name.type === 'spell') return 1;
    if (entity.name.type === 'var') return 2;
    throw new Error('invalid entity name.type: ' + entity.name.type);
  });

  var originalEntity = entities[0];
  var validEntities = [originalEntity];

  if (originalEntity.id) {
    return validEntities;
  }

  var stop = false;

  validEntities = _.takeWhile(entities, function(entity) {
    if (stop) return false;
    if (entity.id) stop = true;
    else if (entity.name.type === 'var') return false;
    return true;
  });

  return validEntities;
};

internal.entity = function(entity, lang) {
  var name = entity.name;
  return wikipedia.entity.info(entity.name.lang, entity.name.name)
    .then(function(info) {
      // if (!info) {
      //   if (name.lang !== 'en') {
      //     lang = name.lang;
      //     name.lang = 'en';
      //     return internal.entity(entity, lang);
      //   }
      //   if (lang) name.lang = lang;
      //   return entity;
      // }

      name.title = info.title;

      entity.title = info.title;
      entity.description = info.description;
      entity.url = info.url;

      return wikipedia.entity.explore(name.lang, entity.title)
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
              return wikipedia.entity.type(eng.title)
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
    });
};
