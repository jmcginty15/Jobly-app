process.env.NODE_ENV = "test";

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../../config");

const app = require("../../app");
const db = require("../../db");
const Job = require("../../models/job");

beforeEach(async function () {
    await db.query(`DELETE FROM users`);
    await db.query(`DELETE FROM jobs`);
    await db.query(`DELETE FROM technologies`);
    await db.query(`DELETE FROM user_technologies`);
    await db.query(`DELETE FROM applications`);

    await db.query(`INSERT INTO users (username, password, first_name, last_name, email, photo_url)
        VALUES ('jmcginty15', '${await bcrypt.hash('password', BCRYPT_WORK_FACTOR)}', 'Jason', 'McGinty', 'jason_mcginty@yahoo.com', 'something.org'),
        ('zach_mcginty', '${await bcrypt.hash('yeet', BCRYPT_WORK_FACTOR)}', 'Zach', 'McGinty', 'zach.mcginty@gmail.com', 'yeet.com'),
        ('cowboy420', '${await bcrypt.hash('nice', BCRYPT_WORK_FACTOR)}', 'Woody', 'Cowboy', 'theresasnakeinmyboot@gmail.com', 'snake.com'),
        ('spaceranger69', '${await bcrypt.hash('nice', BCRYPT_WORK_FACTOR)}', 'Buzz', 'Lightyear', 'totherescue@yahoo.com', 'buzz.com')`);

    let job = await Job.create('Software Engineer', 80000, 0.25, 'springboard');
    await db.query(`INSERT INTO applications (username, job_id, state)
        VALUES ($1, $2, $3)`,
        ['jmcginty15', job.id, 'applied']);

    job = await Job.create('Instructor', 100000, 0.3, 'springboard');
    await db.query(`INSERT INTO applications (username, job_id, state)
        VALUES ($1, $2, $3)`,
        ['cowboy420', job.id, 'interested']);

    job = await Job.create('Coffee Enthusiast', 150000, 0.75, 'black_rifle_coffee');
    await db.query(`INSERT INTO applications (username, job_id, state)
        VALUES ($1, $2, $3)`,
        ['spaceranger69', job.id, 'applied']);

    job = await Job.create('Planner I', 61000, 0, 'austal_usa');
    await db.query(`INSERT INTO applications (username, job_id, state)
        VALUES ($1, $2, $3)`,
        ['cowboy420', job.id, 'accepted']);

    job = await Job.create('Mechanical Engineer I', 90000, 0.1, 'austal_usa');
    await db.query(`INSERT INTO applications (username, job_id, state)
        VALUES ($1, $2, $3)`,
        ['spaceranger69', job.id, 'rejected']);

    const techResult = await db.query(`INSERT INTO technologies (name)
        VALUES ('Python'), ('JavaScript'), ('Microsoft Excel'), ('Brewing'), ('Rifles'), ('AutoCAD')
        RETURNING id`);
    const techIds = techResult.rows;

    await db.query(`INSERT INTO user_technologies (username, technology_id)
        VALUES ('jmcginty15', ${techIds[0].id}),
        ('jmcginty15', ${techIds[1].id}),
        ('jmcginty15', ${techIds[2].id}),
        ('jmcginty15', ${techIds[3].id}),
        ('zach_mcginty', ${techIds[2].id}),
        ('zach_mcginty', ${techIds[3].id}),
        ('cowboy420', ${techIds[3].id}),
        ('spaceranger69', ${techIds[5].id})`);
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
    test("posts new user and responds with jwt", async function () {
        const ace = {
            username: 'petdetective',
            password: 'password',
            firstName: 'Ace',
            lastName: 'Ventura',
            email: 'petdetective@gmail.com'
        };
        const response = await request(app).post('/users/').send(ace);
        expect(response.statusCode).toBe(201);
        const token = response.body.token;
        expect(jwt.decode(token)).toEqual({
            username: 'petdetective',
            isAdmin: false,
            iat: expect.any(Number)
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
                photoUrl: 'buzz.com',
                applications: [
                    {
                        jobId: expect.any(Number),
                        state: 'applied'
                    },
                    {
                        jobId: expect.any(Number),
                        state: 'rejected'
                    }
                ],
                technologies: [
                    { name: 'AutoCAD' }
                ]
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
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        const newInfo = {
            _token: token,
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
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        const newInfo = {
            _token: token,
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
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        const newInfo = {
            _token: token,
            firstName: 'Tim',
            lastName: 'Allen',
            email: 'youareatoy',    // invalid email
            photoUrl: 'toy.story'
        };
        let response = await request(app).patch(`/users/spaceranger69`).send(newInfo);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.email does not conform to the "email" format');
    });

    test("responds with 401 if jwt is for incorrect user or not sent", async function () {
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        const newInfo = {
            _token: token,
            firstName: 'Tim',
            lastName: 'Allen',
            email: 'youareatoy@gmail.com',
            photoUrl: 'toy.story'
        };
        let response = await request(app).patch('/users/jmcginty15').send(newInfo);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Unauthorized');

        delete newInfo._token;
        response = await request(app).patch('/users/spaceranger69').send(newInfo);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
});

describe("DELETE /users/:username", function () {
    test("deletes a user by username", async function () {
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        const response = await request(app).delete(`/users/spaceranger69`).send({ _token: token });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'User deleted' });
    });

    test("responds with 401 if jwt is for incorrect user or not sent", async function () {
        const tokenResponse = await request(app).post('/auth/login').send({ username: 'spaceranger69', password: 'nice' });
        const token = tokenResponse.body.token;

        let response = await request(app).delete(`/users/jmcginty15`).send({ _token: token });
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Unauthorized');

        response = await request(app).delete(`/users/spaceranger69`);
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
});

afterAll(async function () {
    await db.end();
});
