const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const Job = require("./job");

/** Company model */

class Company {

    constructor({ handle, name, num_employees, description, logo_url }) {
        this.handle = handle;
        this.name = name;
        this.numEmployees = num_employees;
        this.description = description;
        this.logoUrl = logo_url;
    }

    /** return array of company handles and names:
     * 
     * => [{ handle, name }, ... ]
     * 
     * optional search by name
     * optional min and max number of employees
     * 
     * returns all companies if no parameters are passed
     * 
     */

    static async search(searchTerm = null, min = null, max = null) {
        min ? min = parseInt(min) : min = 0;
        max ? max = parseInt(max) : max = 999999999;

        if (min > max) {
            throw new ExpressError('min_employees must not be greater than max_employees', 400);
        } else {
            let searchParam = '';
            if (searchTerm) searchParam = ` AND name ILIKE '%${searchTerm}%'`;

            const result = await db.query(`SELECT handle, name FROM companies
                WHERE num_employees >= $1 AND num_employees <= $2${searchParam}
                ORDER BY handle`,
                [min, max]);
            return result.rows;
        }
    }

    /** create new company:
     * 
     * handle, name, numEmployees, description, logoUrl
     *  => Company { handle, name, numEmployees, description, logoUrl }
     * 
     */

    static async create(handle, name, numEmployees, description, logoUrl) {
        const result = await db.query(`INSERT INTO companies (handle, name, num_employees, description, logo_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [handle, name, numEmployees, description, logoUrl]);
        const newCompany = new Company(result.rows[0]);
        return newCompany;
    }

    /** get company by handle:
     * 
     * => Company { handle, name, numEmployees, description, logoUrl }
     * 
     */

    static async get(handle) {
        const result = await db.query(`SELECT * FROM companies
            WHERE handle = $1`,
            [handle]);

        if (result.rowCount === 0) {
            throw new ExpressError(`Company ${handle} not found`, 404);
        } else {
            const company = new Company(result.rows[0]);
            return company;
        }
    }

    /** update company information:
     * 
     * handle, { name, numEmployees, description, logoUrl }
     *  => Company { handle, name, numEmployees, description, logoUrl }
     * 
     */

    static async update(handle, newInfo) {
        if (newInfo.numEmployees) {
            newInfo.num_employees = newInfo.numEmployees;
            delete newInfo.numEmployees;
        }
        if (newInfo.logoUrl) {
            newInfo.logo_url = newInfo.logoUrl;
            delete newInfo.logoUrl;
        }
        const queryObject = sqlForPartialUpdate('companies', newInfo, 'handle', handle);
        const result = await db.query(queryObject.query, queryObject.values);

        if (result.rowCount === 0) {
            throw new ExpressError(`Company ${handle} not found`, 404);
        } else {
            const company = new Company(result.rows[0]);
            return company;
        }
    }

    /** delete company:
     * 
     * => 'Company deleted'
     * 
     */

    static async delete(handle) {
        const result = await db.query(`DELETE FROM companies
            WHERE handle = $1`,
            [handle]);

        if (result.rowCount === 0) {
            throw new ExpressError(`Company ${handle} not found`, 404);
        } else {
            return 'Company deleted';
        }
    }

    /** get company's list of jobs:
     * 
     * => Company { handle, name, numEmployees, description, logoUrl, jobs: [ Job, ... ] }
     * 
     */

    async getJobs() {
        const result = await db.query(`SELECT * FROM jobs
            WHERE company_handle = $1
            ORDER BY date_posted DESC`,
            [this.handle]);
        
        const jobs = result.rows.map(info => new Job(info));
        this.jobs = jobs;
        return this;
    }
}

module.exports = Company;