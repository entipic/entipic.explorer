'use strict';

var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var wikipedia = require('entipic.entity').wikipedia;
var Data = require('./data');

external.explore = function(names) {
	var stop = false;
	return Promise.resolve(names)
		.map(function(name) {
			var entity = {
				name: name
			};
			if (stop) {
				return entity;
			}
			return internal.entity(entity)
				.then(internal.findEnglishEntity)
				.then(function(result) {
					if (result.id) {
						stop = true;
					}
					return result;
				});
		}, {
			concurrency: 1
		})
		.then(internal.filterEntities)
		.then(internal.createUniqueNames);
};

internal.createUniqueNames = function(entities) {

	if (entities === null || entities.length === 0) {
		return [];
	}

	var ids = {};

	function addUniqueName(entity, un) {
		if (!un) {
			return;
		}
		if (ids[un.id]) {
			return;
		}
		ids[un.id] = true;

		entity.uniqueNames.push(un);
	}

	function addEntityNames(entity) {
		entity.uniqueNames = entity.uniqueNames || [];
		var lang = entity.name.lang;
		var country = entity.name.country;

		// is an known entity
		if (entity.id) {
			// add entity wikipedia title:
			// *no need of country code when we have a wikipedia page ID
			// addUniqueName(entity, Data.formatUniqueName(entity.title, lang, country, true, entity.id));
			addUniqueName(entity, Data.formatUniqueName(entity.title, lang, null, true, entity.id, null, entity.name.popularity));
			//addUniqueName(entity, Data.formatUniqueName(entity.title, lang, country, false, entity.id));

			// add synonyms:
			if (entity.redirects) {
				entity.redirects = _.take(entity.redirects, 10);
				entity.redirects.forEach(function(rd) {
					//if ((entity.title.length / 2) < rd.title.length) {
					// *no need of country code when we have a wikipedia page ID
					// addUniqueName(entity, Data.formatUniqueName(rd.title, lang, country, true));
					addUniqueName(entity, Data.formatUniqueName(rd.title, lang, null, true));
					//}
				});
			}

			// add english names:
			if (entity.english) {
				// wikipedia english name:
				addUniqueName(entity, Data.formatUniqueName(entity.english.title, 'en', null, true, entity.english.id));
				// is a very popular entity
				if (entity.english.redirects) {
					entity.english.redirects = _.take(entity.english.redirects, 10);
					// wikipedia english synonyms:
					entity.english.redirects.forEach(function(rd) {
						if ((entity.english.title.length / 2) < rd.title.length) {
							addUniqueName(entity, Data.formatUniqueName(rd.title, 'en', null, true, entity.english.id));
							//addUniqueName(entity, Data.formatUniqueName(rd.title, 'en', null, false, entity.english.id));
						}
					});
				}
			}

			// add simple names:
			addUniqueName(entity, Data.formatUniqueName(entity.name.name, lang, null, true, null, null, entity.name.popularity));
		} else {
			// add simple names:
			addUniqueName(entity, Data.formatUniqueName(entity.name.name, lang, country, true, null, null, entity.name.popularity));
			// addUniqueName(entity, Data.formatUniqueName(entity.name.name, lang, country, false));
		}
	}

	var lastEntity = entities[entities.length - 1];
	if (lastEntity.id) {
		addEntityNames(lastEntity);
	}

	entities.forEach(function(entity) {
		addEntityNames(entity);
	});

	return entities;
};

internal.filterEntities = function(entities) {
	if (!entities || entities.length === 0) {
		return [];
	}

	entities = _.sortBy(entities, function(entity) {
		switch (entity.name.type) {
			case 'original':
				return 0;
			case 'spell':
				return 1;
			case 'var':
				return 2;
			default:
				return Promise.reject(new Error('invalid entity name.type: ' + entity.name.type));
		}
	});

	var originalEntity = entities[0];
	var validEntities = [originalEntity];

	if (originalEntity.id) {
		return validEntities;
	}

	var stop = false;

	validEntities = _.takeWhile(entities, function(entity) {
		if (stop) {
			return false;
		}
		if (entity.id) {
			stop = true;
		} else if (entity.name.type === 'var') {
			return false;
		}
		return true;
	});

	return validEntities;
};

internal.entity = function(entity) {
	return internal.info(entity.name.lang, entity.name.name)
		.then(function(info) {
			if (!info) {
				return entity;
			}
			entity.name.title = info.title;

			return wikipedia.entity.explore(entity.name.lang, info.title)
				.then(function(result) {
					result.name = entity.name;
					result.url = info.url;
					if (info.description) {
						result.description = info.description;
					}

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

internal.info = function(lang, name) {
	return wikipedia.entity.info(lang, name)
		.then(function(info) {
			if (info) {
				return info;
			}
			return wikipedia.entity.search(lang, name)
				.then(function(result) {
					if (result) {
						return wikipedia.entity.info(lang, result.title);
					}
				});
		});
};

internal.findEnglishEntity = function(entity) {
	if (!entity.id) {
		return entity;
	}
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
					entity.english = result;
					return wikipedia.entity.info('en', eng.title)
						.then(function(infoResult) {
							if (infoResult) {
								entity.english.description = infoResult.description;
							}
							return entity;
						})
						.catch(function() {});
				}
				return entity;
			});
		}
	}
	return entity;
};
