'use strict';

const assert = require('assert');
const explorer = require('../lib/entity_explorer');

describe('Entity explorer', function() {
	it('#.explore() - rejected', function() {
		return explorer.explore().then(assert.fail, assert.ok);
	});
	it('#.explore([]) - rejected', function() {
		return explorer.explore([]).then(assert.fail, assert.ok);
	});
	it('#.explore() - one name', function() {
		return explorer.explore([{
				lang: 'ro',
				name: 'enichioi cantemir',
				type: 'original'
			}]);
	});
});
