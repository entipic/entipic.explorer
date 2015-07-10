'use strict';

var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var Images = require('entipic.images').instance();
var imagesExplorer = require('./images_explorer');
var Data = require('./data');
var Counter = require('./counter');

external.update = function(dbUniqueName, entities) {
	var uniqueNames = [];
	entities.forEach(function(entity) {
		uniqueNames = uniqueNames.concat(_.filter(entity.uniqueNames, {
			isLocal: true
		}));
	});

	uniqueNames = _.uniq(uniqueNames);

	// core.logger.info('Updating topic: ', dbUniqueName);

	return Promise.map(uniqueNames, function(uname) {
		uname.topicId = dbUniqueName.topicId;
		uname.pictureId = dbUniqueName.pictureId;
		return Data.control.createUniqueName(uname)
			.then(function(un) {
				core.logger.info('Added a new unique name: ' + un.uniqueName, _.pick(un, 'id', 'name', 'uniquename', 'lang', 'country'));
			})
			.catch(function() {});
	}, {
		concurrency: 2
	});
};

external.create = function(entities, unknownName) {
	var lastEntity = entities[entities.length - 1];
	var q = lastEntity.title || entities[0].name.name;

	// core.logger.info('Creating topic: ' + q);

	return Promise.props({
			topic: internal.buildTopic(entities, unknownName),
			pictures: internal.buildPictures(q, lastEntity)
		})
		.then(function(props) {
			return internal.savePictures(props.topic, props.pictures)
				.then(function(picture) {
					return internal.saveTopic(props.topic, entities, picture)
						.then(function(topic) {
							core.logger.info('Created topic: ' + topic.name, _.pick(topic, 'id', 'name', 'uniqueName', 'country', 'englishWikiName'));
						});
				});
		});
};

internal.saveTopic = function(topic, entities, picture) {
	var uniqueNames = [];
	entities.forEach(function(entity) {
		uniqueNames = uniqueNames.concat(entity.uniqueNames);
	});

	topic.pictureId = picture.id;
	topic.pictureDomain = picture.sourceDomain;

	return Data.control.createTopic(topic).then(function(dbTopic) {
		return Promise.map(uniqueNames, function(uname) {
			uname.topicId = topic.id;
			uname.pictureId = picture.id;
			return Data.control.createUniqueName(uname)
				.catch(function(error) {
					core.logger.error('Error on creating topic unique name: ' + error.message, uname);
				});
		}, {
			concurrency: 2
		}).then(function() {
			return dbTopic;
		});
	});
};

internal.savePictures = function(topic, pictures) {
	var picture;
	return Promise.resolve(pictures).each(function(item) {
		item.topicId = topic.id;
		item.id = Data.formatter.pictureId(item);
		return Images.save(item.id, item.data)
			.then(function() {
				return Data.control.createPicture(item).then(function(pic) {
					picture = picture || pic;
					return pic;
				});
			})
			.catch(function() {});
	}).then(function() {
		return picture;
	});
};

internal.buildTopic = function(entities, unknownName) {
	var lastEntity = entities[entities.length - 1];

	// entities.forEach(function(entity) {
	//   entity.uniqueNames = _.filter(entity.uniqueNames, {
	//     isLocal: true
	//   });
	// });

	var topic = {
		refIP: unknownName.ip,
		refHost: unknownName.host,
		type: lastEntity.type
	};

	if (lastEntity.english) {
		topic.englishWikiId = lastEntity.english.id;
		topic.englishWikiName = lastEntity.english.title;
		topic.englishWikiDescription = lastEntity.english.description;
	}

	return Promise.props({
		id: Counter.inc(process.env.COUNTERS_TOPICS_NAME),
		un: internal.createTopicUniqueName(lastEntity)
	}).then(function(props) {
		topic.id = props.id;
		topic.name = props.un.name;
		topic.uniqueName = props.un.uniqueName;
		return topic;
	});
};

internal.createTopicUniqueName = function(entity) {
	var uniqueNames = [];
	if (entity.english) {
		uniqueNames.push(Data.formatUniqueName(entity.english.title, 'en', null, false, entity.english.id));
		uniqueNames.push(Data.formatUniqueName(entity.english.title, 'en', null, true, entity.english.id));
	}
	if (entity.id) {
		uniqueNames.push(Data.formatUniqueName(entity.title, entity.name.lang, null, true, entity.id));
		uniqueNames.push(Data.formatUniqueName(entity.title, entity.name.lang, entity.name.country, true, entity.id));
	} else {
		uniqueNames.push(Data.formatUniqueName(entity.name.name, entity.name.lang, null, true));
		uniqueNames.push(Data.formatUniqueName(entity.name.name, entity.name.lang, entity.name.country, true));
	}
	var name;
	return Promise.resolve(uniqueNames).each(function(un) {
		if (name) {
			return null;
		}
		return Data.access.uniquename({
				where: {
					_id: un.id
				}
			})
			.then(function(dbUniqueName) {
				if (!dbUniqueName) {
					name = un;
					var exists = _.find(entity.uniqueNames, {
						id: un.id
					});
					un.status = 'selected';
					if (!exists) {
						entity.uniqueNames.push(un);
					}
				}
			});
	}).then(function() {
		return name;
	});
};

internal.buildPictures = function(q, entity) {
	if (entity.type === 'group') {
		q += ' logo';
	}
	var lang = entity.name.lang;
	var country = entity.name.country;
	if (entity.id) {
		country = null;
	}
	var type;
	if (entity.type === 'person') {
		type = 'face';
	} else if (entity.type === 'place') {
		type = 'photo';
	}

	return imagesExplorer.explore(q, lang, country, {
			limit: 2,
			type: type
		})
		.then(function(images) {
			if (images.length === 0) {
				return Promise.reject(new Error('Not found images for: ' + q));
			}
			return images;
		});
};
