var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var utils = require('./utils');
var Images = require('entipic.images').instance();
var Text = require('entipic.text');
var imagesExplorer = require('./images_explorer');
var nameExplorer = require('./name_explorer');
var entityExplorer = require('./entity_explorer');
var Data = require('./data');
var topicManager = require('./topic_manager');

var stoped = false;

external.explore = function() {

  function getList() {
    return Data.access.unknownnames({
      limit: 10,
      order: 'createdAt'
    });
  }

  function start() {
    return getList().then(function(list) {
      if (!list || list.length === 0 || stoped) return;
      return internal.exploreList(list).then(start);
    });
  }

  return start();
};

external.stop = function() {
  stoped = true;
};


internal.exploreList = function(list) {
  return Promise.resolve(list).each(function(item) {
    return internal.exploreItem(item)
      .then(function() {
        return internal.removeItem(item).delay(1000 * 5);
      })
      .catch(function(error) {
        core.logger.error('Explore item error: ' + error.message, error);
        return internal.removeItem(item).delay(1000 * 5);
      });
  });
};

internal.exploreItem = function(item) {
  return nameExplorer.explore(item.name, item.lang, item.country)
    .then(function(names) {
      if (!names || names.length === 0) {
        return Promise.reject(new core.errors.EntipicError({
          message: 'Not found names for: ' + item.name,
          lang: item.lang,
          country: item.country,
          id: item.id,
          uniqueName: item.uniqueName
        }));
      }
      return entityExplorer.explore(names)
        .then(function(entities) {
          return internal.processEntities(entities, item);
        });
    });
};

internal.processEntities = function(entities, unknownName) {
  var lastEntity = entities[entities.length - 1];

  function getDbUniqueNameByWiki() {
    if (lastEntity.id) {
      // search by wikipedia page id
      return internal.getUniqueNameByWiki(lastEntity.id, lastEntity.name.lang)
        .then(function(dbUniqueName) {
          if (dbUniqueName) return dbUniqueName;
          if (lastEntity.english && lastEntity.english.id !== lastEntity.id) {
            return internal.getUniqueNameByWiki(lastEntity.english.id, 'en');
          }
        });
    }
    return Promise.resolve();
  }

  function getDbUniqueNameUniqueNames() {
    var ids = [];

    entities.forEach(function(entity) {
      entity.uniqueNames.forEach(function(un) {
        if (un.isLocale) ids.push(un.id);
      });
    });

    return Data.access.uniquename({
      where: {
        _id: {
          $in: _.uniq(ids)
        }
      },
      select: 'topicId pictureId uniqueName'
    });
  }

  function getDbUniqueName() {
    return getDbUniqueNameByWiki().then(function(dbUniqueName) {
      if (dbUniqueName) return dbUniqueName;
      return getDbUniqueNameUniqueNames();
    });
  }

  return getDbUniqueName().delay(1000 * 5)
    .then(function(dbUniqueName) {
      if (dbUniqueName)
        return topicManager.update(dbUniqueName, entities, unknownName);
      return topicManager.create(entities, unknownName);
    });
};

internal.getUniqueNameByWiki = function(id, lang) {
  return Data.access.uniquename({
    where: {
      wikiId: id,
      wikiLang: lang
    },
    select: 'topicId pictureId'
  });
};

internal.removeItem = function(item) {
  return Data.control.removeUnknownName({
    where: {
      _id: item.id
    }
  });
};
