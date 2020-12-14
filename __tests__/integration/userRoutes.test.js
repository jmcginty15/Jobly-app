process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

beforeEach(async function () {
    await db.query(`DELETE FROM users`);
    await db.query(`INSERT INTO users (username, password, first_name, last_name, email, photo_url)
        VALUES ('jmcginty15', 'password', 'Jason', 'McGinty', 'jason_mcginty@yahoo.com', 'something.org'),
        ('zach_mcginty', 'yeet', 'Zach', 'McGinty', 'zach.mcginty@gmail.com', 'yeet.com'),
        ('cowboy420', 'nice', 'Woody', 'Cowboy', 'theresasnakeinmyboot@gmail.com', 'snake.com'),
        ('spaceranger69', 'nice', 'Buzz', 'Lightyear', 'totherescue@yahoo.com', 'buzz.com')`);
});

describe("GET /users/", function () {
    test("gets full list of users", async function () {
        const response = await request(app).get('/users/');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            users: [
                {
                    username: 'cowboy420',
                    firstName: 'Woody',
                    lastName: 'Cowboy',
                    email: 'theresasnakeinmyboot@gmail.com'
                },
                {
                    username: 'jmcginty15',
                    firstName: 'Jason',
                    lastName: 'McGinty',
                    email: 'jason_mcginty@yahoo.com'
                },
                {
                    username: 'spaceranger69',
                    firstName: 'Buzz',
                    lastName: 'Lightyear',
                    email: 'totherescue@yahoo.com'
                },
                {
                    username: 'zach_mcginty',
                    firstName: 'Zach',
                    lastName: 'McGinty',
                    email: 'zach.mcginty@gmail.com'
                }
            ]
        });
    });
});

describe("POST /users/", function () {
    test("posts new user", async function () {
        const ace = {
            username: 'petdetective',
            password: 'password',
            firstName: 'Ace',
            lastName: 'Ventura',
            email: 'petdetective@gmail.com'
        };
        const response = await request(app).post('/users/').send(ace);
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
            user: {
                username: 'petdetective',
                firstName: 'Ace',
                lastName: 'Ventura',
                email: 'petdetective@gmail.com',
                photoUrl: null
            }
        });
    });

    test("responds with error if sent data is missing or of incorrect type", async function () {
        const ace = {   // missing username
            password: 'password',
            firstName: 'Ace',
            lastName: 'Ventura',
            email: 'petdetective@gmail.com'
        };
        let response = await request(app).post('/users/').send(ace);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance requires property "username"');

        ace.username = 'petdetective';
        delete ace.password;    // missing password
        response = await request(app).post('/users/').send(ace);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance requires property "password"');

        ace.password = 'password';
        ace.email = 'petdetective'; // invalid email
        response = await request(app).post('/users/').send(ace);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.email does not conform to the "email" format');
    });
});

describe("GET /users/:username", function () {
    test("gets user by username", async function () {
        const response = await request(app).get(`/users/spaceranger69`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            user: {
                username: 'spaceranger69',
                firstName: 'Buzz',
                lastName: 'Lightyear',
                email: 'totherescue@yahoo.com',
                photoUrl: 'buzz.com'
            }
        });
    });

    test("responds with 404 if user not found", async function () {
        const response = await request(app).get('/users/imaginaryguy');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User imaginaryguy not found');
    });
});

describe("PATCH /users/:username", function () {
    test("updates a user by username", async function () {
        const newInfo = {
            firstName: 'Tim',
            lastName: 'Allen',
            email: 'youareatoy@gmail.com',
            photoUrl: 'toy.story'
        };
        const response = await request(app).patch(`/users/spaceranger69`).send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            user: {
                username: 'spaceranger69',
                firstName: 'Tim',
                lastName: 'Allen',
                email: 'youareatoy@gmail.com',
                photoUrl: 'toy.story'
            }
        });
    });

    test("works with partial update", async function () {
        const newInfo = {
            email: 'youareatoy@gmail.com',
            photoUrl: 'toy.story'
        };
        const response = await request(app).patch(`/users/spaceranger69`).send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            user: {
                username: 'spaceranger69',
                firstName: 'Buzz',
                lastName: 'Lightyear',
                email: 'youareatoy@gmail.com',
                photoUrl: 'toy.story'
            }
        });
    });

    test("responds with error if data is of incorrect type", async function () {
        const newInfo = {
            firstName: 'Tim',
            lastName: 'Allen',
            email: 'youareatoy',    // invalid email
            photoUrl: 'toy.story'
        };
        let response = await request(app).patch(`/users/spaceranger69`).send(newInfo);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.email does not conform to the "email" format');
    });

    test("responds with 404 if user not found", async function () {
        const newInfo = {
            firstName: 'Tim',
            lastName: 'Allen',
            email: 'youareatoy@gmail.com',
            photoUrl: 'toy.story'
        };
        const response = await request(app).patch('/users/imaginaryguy').send(newInfo);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User imaginaryguy not found');
    });
});

describe("DELETE /users/:username", function () {
    test("deletes a user by username", async function () {
        const response = await request(app).delete(`/users/spaceranger69`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'User deleted' });
    });

    test("responds with 404 if user not found", async function () {
        const response = await request(app).delete('/users/imaginaryguy');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('User imaginaryguy not found');
    });
});

afterAll(async function () {
    await db.end();
});
