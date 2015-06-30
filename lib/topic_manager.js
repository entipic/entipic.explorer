var core = require('entipic.core');
var _ = core._;
var Promise = core.Promise;
var external = module.exports;
var internal = {};
var utils = require('./utils');
var Images = require('entipic.images').instance();
var Text = require('entipic.text');
var imagesExplorer = require('./images_explorer');
var Data = require('./data');

external.update = function(dbUniqueName, entities) {

};

external.create = function(entities) {
  var lastEntity = entities[entities.length - 1];
  var q = lastEntity.title || entities[0].name.name;


};

internal.buildTopic = function(entities) {

};

internal.buildPictures = function(q, lang, country) {

};

internal.createUniqueNames = function(entity, local) {

};
