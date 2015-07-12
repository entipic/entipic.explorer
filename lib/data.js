'use strict';

var external = module.exports;
var Data = require('entipic.data');
var Text = require('entipic.text');
var inited = false;

function init() {
	if (inited) {
		return;
	}
	inited = true;

	var connection = Data.connect(process.env.ENTIPIC_CONNECTION);
	var db = Data.db(connection);
	external.control = new Data.ControlService(db);
	external.access = new Data.AccessService(db);
	external.formatter = Data.formatter;
}

init();

external.formatUniqueName = function(name, lang, country, isLocal, wikiId, wikiLang, popularity) {
	var item;
	try {
		item = {
			name: name,
			uniqueName: Text.uniqueName(name),
			lang: lang,
			country: country,
			isLocal: !!isLocal,
			popularity: popularity
		};
	} catch (e) {
		return null;
	}
	if (isLocal) {
		item.uniqueName = Text.cultureUniqueName(item.uniqueName, lang, country);
		item.isLocal = true;
	}
	if (wikiId) {
		item.wikiId = wikiId;
		item.wikiLang = wikiLang || lang;
	}

	item.id = Data.formatter.uniqueNameId(item.uniqueName);

	return item;
};
