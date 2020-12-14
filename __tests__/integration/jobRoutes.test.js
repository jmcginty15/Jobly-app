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

describe("GET /jobs/", function () {
    test("gets full list of jobs", async function () {
        const response = await request(app).get('/jobs/');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            jobs: [
                {
                    title: 'Planner I',
                    companyHandle: 'austal_usa'
                },
                {
                    title: 'Instructor',
                    companyHandle: 'springboard'
                },
                {
                    title: 'Coffee Enthusiast',
                    companyHandle: 'black_rifle_coffee'
                },
                {
                    title: 'Mechanical Engineer I',
                    companyHandle: 'austal_usa'
                },
                {
                    title: 'Software Engineer',
                    companyHandle: 'springboard'
                }
            ]
        });
    });

    test("searches by job title", async function () {
        const response = await request(app).get('/jobs/?title=eng');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            jobs: [
                {
                    title: 'Mechanical Engineer I',
                    companyHandle: 'austal_usa'
                },
                {
                    title: 'Software Engineer',
                    companyHandle: 'springboard'
                }
            ]
        });
    });

    test("filters results by min salary and equity", async function () {
        let response = await request(app).get('/jobs/?minSalary=100000');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            jobs: [
                {
                    title: 'Instructor',
                    companyHandle: 'springboard'
                },
                {
                    title: 'Coffee Enthusiast',
                    companyHandle: 'black_rifle_coffee'
                }
            ]
        });

        response = await request(app).get('/jobs/?minEquity=0.25');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            jobs: [
                {
                    title: 'Instructor',
                    companyHandle: 'springboard'
                },
                {
                    title: 'Coffee Enthusiast',
                    companyHandle: 'black_rifle_coffee'
                },
                {
                    title: 'Software Engineer',
                    companyHandle: 'springboard'
                }
            ]
        });

        response = await request(app).get('/jobs/?minSalary=120000&minEquity=0.5');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            jobs: [
                {
                    title: 'Coffee Enthusiast',
                    companyHandle: 'black_rifle_coffee'
                }
            ]
        });
    });
});

describe("POST /jobs/", function () {
    test("posts new job", async function () {
        const gofer = {
            title: 'Coffee Gofer',
            salary: 12,
            equity: 0,
            companyHandle: 'black_rifle_coffee'
        };
        const response = await request(app).post('/jobs/').send(gofer);
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({
            job: {
                id: expect.any(Number),
                title: 'Coffee Gofer',
                salary: 12,
                equity: 0,
                companyHandle: 'black_rifle_coffee',
                datePosted: expect.any(String)
            }
        });
    });

    test("responds with error if sent data is missing or of incorrect type", async function () {
        const gofer = {   // missing title
            salary: 12,
            equity: 0,
            companyHandle: 'black_rifle_coffee'
        };
        let response = await request(app).post('/jobs/').send(gofer);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance requires property "title"');

        gofer.title = 'Coffee Gofer';
        gofer.salary = '12';    // salary formatted as string instead of number
        response = await request(app).post('/jobs/').send(gofer);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.salary is not of a type(s) number');

        gofer.salary = 12;
        gofer.equity = 1.2; // equity greater than 1
        response = await request(app).post('/jobs/').send(gofer);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.equity must be less than or equal to 1');
    });
});

describe("GET /jobs/:id", function () {
    test("gets job by id", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = $1`, ['Coffee Enthusiast']);
        const jobId = result.rows[0].id;

        const response = await request(app).get(`/jobs/${jobId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            job: {
                id: jobId,
                title: 'Coffee Enthusiast',
                salary: 150000,
                equity: 0.75,
                companyHandle: 'black_rifle_coffee',
                datePosted: '2019-12-15T06:00:00.000Z'
            }
        });
    });

    test("responds with 404 if job not found", async function () {
        const response = await request(app).get('/jobs/99999');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Job 99999 not found');
    });
});

describe("PATCH /jobs/:id", function () {
    test("updates a job by id", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = $1`, ['Coffee Enthusiast']);
        const jobId = result.rows[0].id;

        const newInfo = {
            title: 'Coffee Gofer',
            salary: 12,
            equity: 0,
            companyHandle: 'austal_usa'
        };
        const response = await request(app).patch(`/jobs/${jobId}`).send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            job: {
                id: jobId,
                title: 'Coffee Gofer',
                salary: 12,
                equity: 0,
                companyHandle: 'austal_usa',
                datePosted: '2019-12-15T06:00:00.000Z'
            }
        });
    });

    test("works with partial update", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = $1`, ['Coffee Enthusiast']);
        const jobId = result.rows[0].id;

        const newInfo = {
            title: 'Coffee Gofer',
            equity: 0
        };
        const response = await request(app).patch(`/jobs/${jobId}`).send(newInfo);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            job: {
                id: jobId,
                title: 'Coffee Gofer',
                salary: 150000,
                equity: 0,
                companyHandle: 'black_rifle_coffee',
                datePosted: '2019-12-15T06:00:00.000Z'
            }
        });
    });

    test("responds with error if data is of incorrect type", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = $1`, ['Coffee Enthusiast']);
        const jobId = result.rows[0].id;

        const newInfo = {
            title: 'Coffee Gofer',
            salary: '12',   // salary formatted as string instead of number
            equity: 0,
            companyHandle: 'austal_usa'
        };
        let response = await request(app).patch(`/jobs/${jobId}`).send(newInfo);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.salary is not of a type(s) number');

        newInfo.salary = 12;
        newInfo.equity = 1.2;   // equity greater than 1
        response = await request(app).patch(`/jobs/${jobId}`).send(newInfo);
        expect(response.statusCode).toBe(400);
        expect(response.body.message[0]).toBe('instance.equity must be less than or equal to 1');
    });

    test("responds with 404 if job not found", async function () {
        const newInfo = {
            title: 'Coffee Gofer',
            salary: 12,
            equity: 0,
            companyHandle: 'austal_usa'
        };
        const response = await request(app).patch('/jobs/99999').send(newInfo);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Job 99999 not found');
    });
});

describe("DELETE /jobs/:id", function () {
    test("deletes a job by id", async function () {
        const result = await db.query(`SELECT id FROM jobs WHERE title = $1`, ['Coffee Enthusiast']);
        const jobId = result.rows[0].id;

        const response = await request(app).delete(`/jobs/${jobId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Job deleted' });
    });

    test("responds with 404 if job not found", async function () {
        const response = await request(app).delete('/jobs/99999');
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toBe('Job 99999 not found');
    });
});

afterAll(async function () {
    await db.end();
});
