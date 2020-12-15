const { user } = require('../db');
const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require("../helpers/partialUpdate");

/** Application model */

class Application {

    constructor({ username, job_id, state, created_at }) {
        this.username = username;
        this.jobId = job_id;
        this.state = state;
        this.createdAt = created_at;
    }

    /** get application by username and jobId:
     * 
     * => Application { username, job_id, state, created_at }
     * 
     */

    static async get(username, jobId) {
        const result = await db.query(`SELECT * FROM applications
            WHERE username = $1 AND job_id = $2`,
            [username, jobId]);

        if (result.rowCount === 0) {
            throw new ExpressError(`Application not found`, 404);
        } else {
            const user = new User(result.rows[0]);
            return user;
        }
    }

    /** create application:
     * 
     * username, jobId, state => Application { username, job_id, state, created_at }
     * 
     * if application already exists, updates and returns existing application
     * 
     */

    static async create(username, jobId, state) {
        let existingApplication = await db.query(`SELECT * FROM applications
            WHERE username = $1 AND job_id = $2`,
            [username, jobId]);

        if (existingApplication.rowCount === 0) {
            const states = ['interested', 'applied'];

            if (states.includes(state)) {
                const result = await db.query(`INSERT INTO applications (username, job_id, state)
                    VALUES ($1, $2, $3)
                    RETURNING *`,
                    [username, jobId, state]);
                const application = new Application(result.rows[0]);
                return application;
            } else {
                throw new ExpressError('Invalid application state', 400);
            }
        } else {
            const application = new Application(existingApplication.rows[0]);
            await application.update(state);
            return application;
        }
    }

    /** update application:
     * 
     * => Application { username, job_id, state, created_at }
     * 
     */

    async update(newState) {
        const states = ['interested', 'applied', 'accepted', 'rejected'];

        if (states.includes(newState)) {
            const result = await db.query(`UPDATE applications
                SET state = $1
                WHERE username = $2 AND job_id = $3
                RETURNING *`,
                [newState, this.username, this.jobId]);
        } else {
            throw new ExpressError('Invalid application state', 400);
        }
    }

}

module.exports = Application;