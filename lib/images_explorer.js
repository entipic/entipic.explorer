var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var utils = require('./utils');
var imagesSearch = require('./google/images_search');
var Images = require('entipic.images').instance();
var Url = require('url');

external.exploreTopics = function(topics) {
  var topic = _.find(topics, 'id') || _.find(topics, function(item) {
    return item.name.type === 'original';
  });

  var name = topic && (topic.title || topic.name.name) || topics[0].name.name;

  return external.explore(name, topics[0].name.lang, topics[0].name.country);
};

external.explore = function(name, lang, country, options) {
  return imagesSearch.search(name, lang, country, options)
    .map(function(url) {
      return utils.requestImage({
          url: url,
          headers: {
            'User-Agent': utils.USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.8,cs;q=0.6,es;q=0.4,hu;q=0.2,it;q=0.2,lt;q=0.2,ro;q=0.2,ru;q=0.2,sk;q=0.2,uk;q=0.2,pl;q=0.2,bg;q=0.2'
          },
          encoding: null,
          timeout: 1000 * 5
        })
        .then(function(body) {
          return internal.processImage(body, url);
        }).catch(function() {});
    }, {
      concurrency: 2
    }).then(function(images) {
      images = images.filter(function(image) {
        return !!image || image && image.data.length < 5000;
      });

      return images;
    });
};

internal.processImage = function(data, url) {
  return Images.dhash(data).then(function(hash) {
    return {
      dHash: hash,
      sourceUrl: url,
      sourceDomain: Url.parse(url.toLowerCase()).host.replace(/^www\./, ''),
      data: data
    };
  });
};
