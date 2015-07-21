'use strict';

var external = module.exports;
var core = require('entipic.core');
var Data = require('entipic.data');
var Text = require('entipic.text');

var connection = Data.connect(process.env.ENTIPIC_CONNECTION);
var db = Data.db(connection);
external.control = new Data.ControlService(db);
external.access = new Data.AccessService(db);
external.formatter = Data.formatter;

external.close = connection.close;

external.formatUniqueName = function(item) {
	try {
		item.uniqueName = Text.uniqueName(item.name);
	} catch (e) {
		return null;
	}
	if (item.isLocal) {
		item.uniqueName = Text.cultureUniqueName(item.uniqueName, item.lang, item.country);
	}
	if (item.wikiId) {
		item.wikiLang = item.wikiLang || item.lang;
	}

	item.id = Data.formatter.uniqueNameId(item.uniqueName);

	return item;
};

connection.on('error', function(error) {
	core.logger.error('Connection error: ' + error.message, error);
});
