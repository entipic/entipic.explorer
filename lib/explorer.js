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
var topicExplorer = require('./topic_explorer');
var Data = require('./data');

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
      return topicExplorer.explore(names)
        .then(function(topics) {
          var theTopic = _.find(topics, 'id');
          var uns = internal.createUniqueNames(topics, theTopic);
          // console.log(uns);
          // return imagesExplorer.exploreTopics(topics);
        });
    });
};

internal.findExistingUniqueNames = function(uniquenames) {

};

internal.removeItem = function(item) {
  return Data.control.removeUnknownName({
    where: {
      _id: item.id
    }
  });
};

internal.createUniqueNames = function(topics, theTopic) {
  var list = [];

  var ids = {};

  topics = _.filter(topics, function(topic) {
    return topic.name.type !== 'var' || topic.id;
  });

  //var theTopic = _.find(topics, 'id');

  if (theTopic) {
    console.log('found topic', theTopic.title);
  }

  //console.log('INIT topics', topics);

  topics = _.sortBy(topics, 'id', 'name.popularity');
  topics.reverse();
  //console.log('SORTED topics', topics);
  topics.forEach(function(topic) {
    var names = [];
    if (topic.title) names.push(topic.title);
    //if (topic.name.title) names.push(topic.name.title);
    if (topic.name.name) names.push(topic.name.name);

    if (theTopic) {
      if (theTopic.redirects) {
        theTopic.redirects.forEach(function(rd) {
          if ((theTopic.title.length / 2) < rd.title.length) {
            names.push(rd.title);
          }
        });
      }
    }

    names.forEach(function(name) {
      var uns = [Text.uniqueName(name)];
      uns.push(Text.cultureUniqueName(uns[0], topic.name.lang, topic.name.country));
      uns.forEach(function(un) {
        if (ids[un]) return;
        ids[un] = true;
        list.push({
          uniqueName: un,
          name: name,
          lang: topic.name.lang,
          country: topic.name.country,
          id: Data.formatter.uniqueNameId(un)
        });
      });
    });
  });

  return list;
};
