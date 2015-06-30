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
      limit: 10
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
        //return item.removeItem(item);
      })
      .catch(function(error) {
        console.log('error', error);
      });
  });
};

internal.exploreItem = function(item) {
  return nameExplorer.explore(item.name, item.lang, item.country)
    .then(function(names) {
      return entityExplorer.explore(names)
        .then(internal.processEntities);
    });
};

internal.processEntities = function(entities) {
  var lastEntity = entities[entities.length - 1];

  function getDbUniqueNameByWiki() {
    if (lastEntity.id) {
      // search by wikipedia page id
      return internal.getUniqueNameByWiki(lastEntity.id, lastEntity.name.lang)
        .then(function(dbUniqueName) {
          if (dbUniqueName) return dbUniqueName;
          var englishLink = _.find(lastEntity.langlinks, {
            lang: 'en'
          });
          if (englishLink) {
            return internal.getUniqueNameByWiki(englishLink.id, 'en');
          }
        });
    }
    return Promise.resolve();
  }

  function getDbUniqueNameUniqueNames() {
    var ids = [];

    entities.forEach(function(entity) {
      var lang = entity.name.lang;
      var country = entity.name.country;
      if (entity.title) {
        ids.push(internal.uniqueNameId(entity.title, lang, country));
      }
      ids.push(internal.uniqueNameId(entity.name.name, lang, country));
      if (entity.redirects) {
        entity.redirects.forEach(function(rd) {
          if ((entity.title.length / 2) < rd.title.length) {
            ids.push(internal.uniqueNameId(rd.title, lang, country));
          }
        });
      }
    });

    return Data.access.uniquename({
      where: {
        _id: {
          $in: ids
        }
      },
      select: 'topicId pictureId'
    });
  }

  function getDbUniqueName() {
    return getDbUniqueNameByWiki().then(function(dbUniqueName) {
      if (dbUniqueName) return dbUniqueName;
      return getDbUniqueNameUniqueNames();
    });
  }

  return getDbUniqueName()
    .then(function(dbUniqueName) {
      if (dbUniqueName)
        return topicManager.update(dbUniqueName, entities);
      return topicManager.create(entities);
    });
};

internal.uniqueNameId = function(name, lang, country) {
  var un = Text.uniqueName(name);
  if (lang)
    un = Text.cultureUniqueName(un, lang, country);

  return Data.formatter.uniqueNameId(un);
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
