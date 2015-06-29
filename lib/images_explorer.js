var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var utils = require('./utils');
var imagesSearch = require('./google/images_search');
var Images = require('entipic.images').instance();

external.exploreTopics = function(topics) {
  var topic = _.find(topics, 'id') || _.find(topics, function(item) {
    return item.name.type === 'original';
  });

  var name = topic && (topic.title || topic.name.name) || topics[0].name.name;

  return external.explore(name, topics[0].name.lang, topics[0].name.country);
};

external.explore = function(name, lang, country) {
  return imagesSearch.search(name, lang, country, {
      limit: 2
    })
    .map(function(url) {
      return utils.request({
          url: url,
          headers: {
            'User-Agent': utils.USER_AGENT
          },
          encoding: null,
          timeout: 1000 * 5
        })
        .then(function(body) {
          return internal.processImage(body, url);
        })
        .catch(function() {});
    }, {
      concurrency: 2
    });
};

internal.processImage = function(data, url) {
  return Images.dhash(data).then(function(hash) {
    return {
      dHash: hash,
      sourceUrl: url,
      data: data
    };
  });
};
