'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const User = require('../src/user');
const groups = require('../src/groups');

describe('User', () => {
	// Variables globales

	before(async () => {
		global.config = { userLang: 'en-GB' };
	});

	describe('description general', () => {
		it('context 1', async () => {

		});

		it('context 2', async () => {

		});

		it('context 3', async () => {

		});

		it('context 4', async () => {

		});
	});
});
