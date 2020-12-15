const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require("../helpers/partialUpdate");

/** Job model */

class Job {

    constructor({ id, title, salary, equity, company_handle, date_posted }) {
        this.id = id;
        this.title = title;
        this.salary = salary;
        this.equity = equity;
        this.companyHandle = company_handle;
        this.datePosted = date_posted;
    }

    /** return array of job titles and company handles:
     * 
     * => [{ title, companyHandle }, ... ]
     * 
     * optional search by title
     * optional min salary and equity
     * 
     * returns all jobs if no parameters are passed
     * 
     */

    static async search(searchTerm = null, minSalary = null, minEquity = null) {
        minSalary ? minSalary = parseFloat(minSalary) : minSalary = 0;
        minEquity ? minEquity = parseFloat(minEquity) : minEquity = 0;

        let searchParam = '';
        if (searchTerm) searchParam = ` AND title ILIKE '%${searchTerm}%'`;

        const result = await db.query(`SELECT title, company_handle AS "companyHandle" FROM jobs
            WHERE salary >= $1 AND equity >= $2${searchParam}
            ORDER BY date_posted DESC`,
            [minSalary, minEquity]);

        return result.rows;
    }

    /** return array of job titles and company handles that match an array of technologies:
     * 
     * => [{ title, companyHandle }, ... ]
     * 
     */

    static async searchByTechnology(technologies) {
        const result = await db.query(`SELECT * FROM jobs
            ORDER BY date_posted DESC`);
        const allJobs = result.rows.map(job => new Job(job));

        const jobMatches = [];
        for (let job of allJobs) {
            await job.getTechnologies();
            const jobTechnologies = job.technologies.map(tech => tech.name);
            const userTechnologies = technologies.map(tech => tech.name);
            const intersection = jobTechnologies.filter(tech => userTechnologies.includes(tech));

            if (intersection.length > 0) {
                jobMatches.push({ title: job.title, companyHandle: job.companyHandle });
            }
        }

        return jobMatches;
    }

    /** create new job:
     * 
     * title, salary, equity, companyHandle
     *  => Job { id, title, salary, equity, companyHandle, datePosted }
     * 
     */

    static async create(title, salary, equity, companyHandle) {
        const result = await db.query(`INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [title, salary, equity, companyHandle]);
        const newJob = new Job(result.rows[0]);
        return newJob;
    }

    /** get job by id:
     * 
     * => Job { id, title, salary, equity, companyHandle, datePosted }
     * 
     */

    static async get(id) {
        const result = await db.query(`SELECT * FROM jobs
            WHERE id = $1`,
            [id]);

        if (result.rowCount === 0) {
            throw new ExpressError(`Job ${id} not found`, 404);
        } else {
            const job = new Job(result.rows[0]);
            return job;
        }
    }

    /** update job information:
     * 
     * id, { title, salary, equity, companyHandle }
     *  => Job { id, title, salary, equity, companyHandle, datePosted }
     * 
     */

    static async update(id, newInfo) {
        if (newInfo.companyHandle) {
            newInfo.company_handle = newInfo.companyHandle;
            delete newInfo.companyHandle;
        }

        const queryObject = sqlForPartialUpdate('jobs', newInfo, 'id', id);
        const result = await db.query(queryObject.query, queryObject.values);

        if (result.rowCount === 0) {
            throw new ExpressError(`Job ${id} not found`, 404);
        } else {
            const job = new Job(result.rows[0]);
            return job;
        }
    }

    /** delete job:
     * 
     * => 'Job deleted'
     * 
     */

    static async delete(id) {
        const result = await db.query(`DELETE FROM jobs
            WHERE id = $1`,
            [id]);

        if (result.rowCount === 0) {
            throw new ExpressError(`Job ${id} not found`, 404);
        } else {
            return 'Job deleted';
        }
    }

    /** get job's list of technologies:
     * 
     * => Job { id, title, salary, equity, companyHandle, datePosted, technologies: [ { name }, ... ] }
     * 
     */

    async getTechnologies() {
        const result = await db.query(`SELECT name FROM technologies
            WHERE id IN (
                SELECT technology_id FROM job_technologies
                WHERE job_id = $1
            )
            ORDER BY name`,
            [this.id]);

        const technologies = result.rows;
        this.technologies = technologies;
        return this;
    }

}

module.exports = Job;