process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../../app");
const db = require("../../db");

beforeEach(async function () {
    await db.query(`DELETE FROM jobs`);
    await db.query(`DELETE FROM companies`);
    await db.query(`INSERT INTO companies (handle, name, num_employees, description, logo_url)
        VALUES ('springboard', 'Springboard', 5000, 'Software development bootcamp service', 'springboard.com'),
            ('black_rifle_coffee', 'Black Rifle Coffee', 300, 'Patriotic coffee company', 'blackriflecoffee.com'),
            ('austal_usa', 'Austal USA', 1000, 'US affiliate of an Australian shipbuilding company', 'austalusa.com')`);
    await db.query(`INSERT INTO jobs (title, salary, equity, company_handle, date_posted)
        VALUES ('Software Engineer', 80000, 0.25, 'springboard', '2017-06-06'),
        ('Instructor', 100000, 0.3, 'springboard', '2020-01-09'),
        ('Coffee Enthusiast', 150000, 0.75, 'black_rifle_coffee', '2019-12-15'),
        ('Planner I', 61000, 0, 'austal_usa', '2020-11-20'),
        ('Mechanical Engineer I', 90000, 0.1, 'austal_usa', '2018-03-27')`);
});

describe("GET /companies/", function () {
    test("gets full list of companies", async function () {
        const response = await request(app).get('/companies/');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [
                {
                    handle: 'austal_usa',
                    name: 'Austal USA'
                },
                {
                    handle: 'black_rifle_coffee',
                    name: 'Black Rifle Coffee'
                },
                {
                    handle: 'springboard',
                    name: 'Springboard'
                }
            ]
        });
    });

    test("searches by company name", async function () {
        const response = await request(app).get('/companies/?name=bla');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [
                {
                    handle: 'black_rifle_coffee',
                    name: 'Black Rifle Coffee'
                }
            ]
        });
    });

    test("filters results by min and max employees", async function () {
        let response = await request(app).get('/companies/?minEmployees=400');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [
                {
                    handle: 'austal_usa',
                    name: 'Austal USA'
                },
                {
                    handle: 'springboard',
                    name: 'Springboard'
                }
            ]
        });

        response = await request(app).get('/companies/?maxEmployees=2000');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [
                {
                    handle: 'austal_usa',
                    name: 'Austal USA'
                },
                {
                    handle: 'black_rifle_coffee',
                    name: 'Black Rifle Coffee'
                }
            ]
        });

        response = await request(app).get('/companies/?minEmployees=400&maxEmployees=2000');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [
                {
                    handle: 'austal_usa',
                    name: 'Austal USA'
                }
            ]
        });
    });
});

describe("POST /companies/", function () {
    test("posts new company", async function () {
        const pacl = {
            handle: 'pacl',
            name: 'Pro Am Chess League',
            numEmployees: 2,
            description: 'Chess club in Lenexa, KS',
            logoUrl: 'pacl.com'
        };
        const response = await request(app).post('/companies/').send(pacl);
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({ company: pacl });
    });

    test("responds with error if sent data is missing or of incorrect type", async function () {
        const pacl = { // missing handle
            name: 'Pro Am Chess League',
            numEmployees: 2,
            description: 'Chess club in Lenexa, KS',
            logoUrl: 'pacl.com'
        };
        let response = await request(app).post('/companies/').send(pacl);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance requires property "handle"');

        pacl.handle = 'pacl';
        pacl.numEmployees = '2';    // numEmployees formatted as string instead of int
        response = await request(app).post('/companies/').send(pacl);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.numEmployees is not of a type(s) integer');
    });
});

describe("GET /companies/:handle", function () {
    test("gets company by handle", async function () {
        const response = await request(app).get('/companies/springboard');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                handle: 'springboard',
                name: 'Springboard',
                numEmployees: 5000,
                description: 'Software development bootcamp service',
                logoUrl: 'springboard.com',
                jobs: [
                    {
                        id: expect.any(Number),
                        title: 'Instructor',
                        salary: 100000,
                        equity: 0.3,
                        companyHandle: 'springboard',
                        datePosted: '2020-01-09T06:00:00.000Z'
                    },
                    {
                        id: expect.any(Number),
                        title: 'Software Engineer',
                        salary: 80000,
                        equity: 0.25,
                        companyHandle: 'springboard',
                        datePosted: '2017-06-06T05:00:00.000Z'
                    }
                ]
            }
        });
    });

    test("responds with 404 if company not found", async function () {
        const response = await request(app).get('/companies/pacl');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Company pacl not found');
    });
});

describe("PATCH /companies/:handle", function () {
    test("updates a company by handle", async function () {
        const newInfo = {
            name: 'Springboard Software Engineering',
            numEmployees: 4000,
            description: 'Software engineering bootcamp service',
            logoUrl: 'springboard.org'
        };
        const response = await request(app).patch('/companies/springboard').send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                handle: 'springboard',
                name: 'Springboard Software Engineering',
                numEmployees: 4000,
                description: 'Software engineering bootcamp service',
                logoUrl: 'springboard.org'
            }
        });
    });

    test("works with partial update", async function () {
        const newInfo = {
            numEmployees: 4000,
            logoUrl: 'springboard.org'
        };
        const response = await request(app).patch('/companies/springboard').send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                handle: 'springboard',
                name: 'Springboard',
                numEmployees: 4000,
                description: 'Software development bootcamp service',
                logoUrl: 'springboard.org'
            }
        });
    });

    test("responds with error if data is of incorrect type", async function () {
        const newInfo = {
            numEmployees: '4000',   // numEmployees formatted as string instead of int
            logoUrl: 'springboard.org'
        };
        const response = await request(app).patch('/companies/springboard').send(newInfo);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.numEmployees is not of a type(s) integer');
    });

    test("responds with 404 if company not found", async function () {
        const newInfo = {
            name: 'Springboard Software Engineering',
            numEmployees: 4000,
            description: 'Software engineering bootcamp service',
            logoUrl: 'springboard.org'
        };
        const response = await request(app).patch('/companies/pacl').send(newInfo);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Company pacl not found');
    });
});

describe("DELETE /companies/:handle", function () {
    test("deletes a company by handle", async function () {
        const response = await request(app).delete('/companies/springboard');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Company deleted' });
    });

    test("responds with 404 if company not found", async function () {
        const response = await request(app).delete('/companies/pacl');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Company pacl not found');
    });
});

afterAll(async function () {
    await db.end();
});
