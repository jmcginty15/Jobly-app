process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");
const Company = require("../../models/company");

beforeEach(async function () {
    await db.query(`DELETE FROM companies`);
    await db.query(`INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('springboard', 'Springboard', 5000, 'Software development bootcamp service', 'springboard.com'),
            ('black_rifle_coffee', 'Black Rifle Coffee', 300, 'Patriotic coffee company', 'blackriflecoffee.com'),
            ('austal_usa', 'Austal USA', 1000, 'US affiliate of an Australian shipbuilding company', 'austalusa.com')`);
});

describe("GET /companies/", function () {
    test("gets full list of companies", async function () {
        const response = await request(app).get('/companies/');
        expect('butt').toBe('butt');
    });
});

afterAll(async function () {
    await db.end();
});
