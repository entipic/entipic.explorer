'use strict';

const Promise = require('bluebird');
const logger = require('./logger');
const finder = require('entipic.finder');
const Data = finder.Data;

let stoped = false;

finder.logger.set(logger);

exports.explore = function() {
	stoped = false;
	var startDate = new Date();

	function getList() {

		if (process.env.RUN_TIMEOUT) {
			var now = (new Date()).getTime();
			var limit = startDate.getTime() + (process.env.RUN_TIMEOUT * 1000 * 60);
			if (limit < now) {
				stoped = true;
				logger.warn('RUN_TIMEOUT');
				return Promise.resolve([]);
			}
		}
		return Data.access.unknownnames({
			where: {
				status: 'new'
			},
			limit: 10,
			order: 'createdAt'
		});
	}

	function start() {
		return getList()
			.then((list) => {
				if (!list || list.length === 0 || stoped) {
					return 0;
				}
				return Promise.each(list, (item) => {
					return finder.find(item).then(() => {
							return Data.control.removeUnknownName({
								where: {
									_id: item.id
								}
							});
						})
						.catch((error) => {
							logger.error(error);
							return Data.control.updateUnknownName({ id: item.id, status: 'error' });
						});
				}).then(start);
			});
	}

	return start();
};

exports.stop = function() {
	stoped = true;
};
