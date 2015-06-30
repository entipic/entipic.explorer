var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var Text = require('entipic.text');
var wikipedia = require('entipic.entity').wikipedia;
var Data = require('./data');

external.explore = function(names) {
  return Promise.resolve(names).map(function(name) {
      var entity = {
        name: name
      };
      return internal.entity(entity).then(internal.findEnglishEntity);
    }, {
      concurrency: 1
    })
    .then(internal.filterEntities)
    .then(internal.createUniqueNames)
    .catch(function(error) {
      core.logger.error('Error on processing names: ' + JSON.stringify(names), error);
    });
};

internal.createUniqueNames = function(entities) {

  var ids = {};

  function addUniqueName(entity, un) {
    if (ids[un.id]) return;
    ids[un.id] = true;

    entity.uniqueNames.push(un);
  }

  var lastEntity = entities[entities.length - 1];
  if (lastEntity.id) {
    lastEntity.uniqueNames = [];
    addUniqueName(lastEntity, Data.formatUniqueName(lastEntity.title, lastEntity.name.lang, lastEntity.name.country, true, lastEntity.id));
    addUniqueName(lastEntity, Data.formatUniqueName(lastEntity.title, lastEntity.name.lang, lastEntity.name.country, false, lastEntity.id));

    if (lastEntity.english) {
      addUniqueName(lastEntity, Data.formatUniqueName(lastEntity.english.title, 'en', null, true, lastEntity.english.id));
    }
  }

  entities.forEach(function(entity) {
    entity.uniqueNames = entity.uniqueNames || [];
    var lang = entity.name.lang;
    var country = entity.name.country;
    if (entity.title) {
      addUniqueName(entity, Data.formatUniqueName(entity.title, lang, country, true, entity.id));
      addUniqueName(entity, Data.formatUniqueName(entity.title, lang, country, false, entity.id));
    }
    addUniqueName(entity, Data.formatUniqueName(entity.name.name, lang, country, true));
    addUniqueName(entity, Data.formatUniqueName(entity.name.name, lang, country, false));

    if (entity.redirects) {
      entity.redirects.forEach(function(rd) {
        if ((entity.title.length / 2) < rd.title.length) {
          addUniqueName(entity, Data.formatUniqueName(rd.title, lang, country, true));
          //addUniqueName(entity, internal.formatUniqueName(rd.title, lang, country, false));
        }
      });
    }

  });

  return entities;
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

internal.entity = function(entity) {
  return wikipedia.entity.info(entity.name.lang, entity.name.name)
    .then(function(info) {
      if (!info) return entity;
      entity.name.title = info.title;

      return wikipedia.entity.explore(entity.name.lang, info.title)
        .then(function(result) {
          result.name = entity.name;

          if (result.langlinks || entity.name.lang === 'en') {
            var eng = result.langlinks && _.find(result.langlinks, {
              lang: 'en'
            });
            if (entity.name.lang === 'en') {
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

internal.findEnglishEntity = function(entity) {
  if (!entity.id) return entity;
  if (entity.name.lang === 'en') {
    entity.english = {
      id: entity.id,
      title: entity.title,
      description: entity.description
    };
    return entity;
  }
  if (entity.langlinks) {
    var eng = _.find(entity.langlinks, {
      lang: 'en'
    });
    if (eng) {
      return wikipedia.entity.explore('en', eng.title).then(function(result) {
        if (result.id) {
          entity.english = {
            id: result.id,
            title: result.title,
            description: result.description
          };
        }
        return entity;
      });
    }
  }
  return entity;
};
