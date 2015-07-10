'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;
var explorer = require('../lib/entity_explorer');

chai.use(chaiAsPromised);

describe('Entity explorer', function() {
	it('#.explore() - rejected', function() {
		assert.isRejected(explorer.explore());
	});
	it('#.explore([]) - rejected', function() {
		assert.isFulfilled(explorer.explore([]));
	});
	it('#.explore() - one name', function() {
		return explorer.explore([{
				lang: 'ro',
				name: 'enichioi cantemir',
				type: 'original'
			}]);
		//assert.isFulfilled(explorer.explore([{lang: 'ro', name: 'enichioi cantemir'}]));
	});
});
