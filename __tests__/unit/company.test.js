process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require("../../app");
const db = require("../../db");
const Company = require('../../models/company');

describe("Company", () => {
    describe("search(searchTerm = null, min = null, max = null)", function () {
    });
});
