const express = require("express");
const Company = require("../models/company");

const jsonschema = require("jsonschema");
const addCompanySchema = require("../schemas/company/addCompanySchema.json");
const updateCompanySchema = require("../schemas/company/updateCompanySchema.json");

const ExpressError = require("../helpers/expressError");

const router = new express.Router();

/** GET / => { companies: [{ handle, name }, ... ]} */

router.get('/', async (request, response, next) => {
    try {
        const { name, min, max } = request.query;
        const companies = await Company.search(name, min, max);
        return response.json({ companies: companies });
    } catch (err) {
        return next(err);
    }
});

/** POST / { handle, name, num_employees, description, logo_url }
 *      => { company: { handle, name, num_employees, description, logo_url } }
 */

router.post('/', async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, addCompanySchema);

        if (result.valid) {
            const { handle, name, numEmployees, description, logoUrl } = request.body;
            const newCompany = await Company.create(handle, name, numEmployees, description, logoUrl);
            return response.json({ company: newCompany });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** GET /:handle => { company: { handle, name, num_employees, description, logo_url } } */

router.get('/:handle', async (request, response, next) => {
    try {
        const company = await Company.get(request.params.handle);
        return response.json({ company: company });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:handle { name, num_employees, description, logo_url }
 *      => { company: { handle, name, num_employees, description, logo_url } }
*/

router.patch('/:handle', async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, updateCompanySchema);

        if (result.valid) {
            const newInfo = request.body;
            const updatedCompany = await Company.update(request.params.handle, newInfo);
            return response.json({ company: updatedCompany });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** DELETE /:handle => { message: 'Company deleted' } */

router.delete('/:handle', async (request, response, next) => {
    try {
        const message = await Company.delete(request.params.handle);
        return response.json({ message: message });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;