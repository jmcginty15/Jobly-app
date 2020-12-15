const express = require("express");
const Job = require("../models/job");
const Application = require("../models/application");

const jsonschema = require("jsonschema");
const addJobSchema = require("../schemas/job/addJobSchema.json");
const updateJobSchema = require("../schemas/job/updateJobSchema.json");

const ExpressError = require("../helpers/expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");

const router = new express.Router();

/** GET / => { jobs: [{ title, companyHandle }, ... ]} */

router.get('/', ensureLoggedIn, async (request, response, next) => {
    try {
        const { title, minSalary, minEquity } = request.query;
        const jobs = await Job.search(title, minSalary, minEquity);
        return response.json({ jobs: jobs });
    } catch (err) {
        return next(err);
    }
});

/** POST / { title, salary, equity, companyHandle }
 *      => { job: { id, title, salary, equity, companyHandle, datePosted } }
 */

router.post('/', ensureAdmin, async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, addJobSchema);

        if (result.valid) {
            const { title, salary, equity, companyHandle } = request.body;
            const newJob = await Job.create(title, salary, equity, companyHandle);
            return response.status(201).json({ job: newJob });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** GET /:id => { job: { id, title, salary, equity, companyHandle, datePosted } } */

router.get('/:id', ensureLoggedIn, async (request, response, next) => {
    try {
        const job = await Job.get(request.params.id);
        return response.json({ job: job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:id { title, salary, equity, companyHandle }
 *      => { job: { id, title, salary, equity, companyHandle, datePosted } }
 */

router.patch('/:id', ensureAdmin, async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, updateJobSchema);

        if (result.valid) {
            const newInfo = request.body;
            const updatedJob = await Job.update(request.params.id, newInfo);
            return response.json({ job: updatedJob });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** DELETE /:id => { message: 'Job deleted' } */

router.delete('/:id', ensureAdmin, async (request, response, next) => {
    try {
        const message = await Job.delete(request.params.id);
        return response.json({ message: message });
    } catch (err) {
        return next(err);
    }
});

/** POST /:id/interested { _token: token } => { message: 'interested' } */

router.post('/:id/interested', ensureLoggedIn, async (request, response, next) => {
    try {
        await Application.create(request.user.username, request.params.id, 'interested');
        return response.status(201).json({ message: 'interested' });
    } catch (err) {
        return next(err);
    }
});

/** POST /:id/apply { _token: token } => { message: 'applied' } */

router.post('/:id/apply', ensureLoggedIn, async (request, response, next) => {
    try {
        await Application.create(request.user.username, request.params.id, 'applied');
        return response.status(201).json({ message: 'applied' });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;