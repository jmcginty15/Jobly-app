process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require('jsonwebtoken');

const app = require("../../app");
const db = require("../../db");
const User = require("../../models/user");

beforeAll(async function () {
    await db.query(`DELETE FROM users`);

    let username = 'petdetective';
    let password = 'password';
    let firstName = 'Ace';
    let lastName = 'Ventura';
    let email = 'petdetective@gmail.com';
    let photoUrl = 'ace.com';
    await User.register(username, password, firstName, lastName, email, photoUrl);

    username = 'petdetectiveAdmin';
    password = 'password';
    firstName = 'Ace';
    lastName = 'Ventura';
    email = 'petdetectiveadmin@gmail.com';
    photoUrl = 'aceAdmin.com';
    const isAdmin = true;
    await User.register(username, password, firstName, lastName, email, photoUrl, isAdmin);
});

describe("POST /auth/login", function () {
    test("logs in a user and returns jwt", async function () {
        const response = await request(app).post('/auth/login').send({ username: 'petdetective', password: 'password' });
        expect(response.statusCode).toBe(200);
        const payload = jwt.decode(response.body.token);
        expect(payload).toEqual({
            username: 'petdetective',
            isAdmin: false,
            iat: expect.any(Number)
        });
    });

    test("jwt recognizes admin user", async function () {
        const response = await request(app).post('/auth/login').send({ username: 'petdetectiveAdmin', password: 'password' });
        expect(response.statusCode).toBe(200);
        const payload = jwt.decode(response.body.token);
        expect(payload).toEqual({
            username: 'petdetectiveAdmin',
            isAdmin: true,
            iat: expect.any(Number)
        });
    });
});

afterAll(async function () {
    await db.end();
});
