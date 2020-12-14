const db = require('../db');
const ExpressError = require('../helpers/expressError');
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User model */

class User {

    constructor({ username, first_name, last_name, email, photo_url, is_admin }) {
        this.username = username;
        this.firstName = first_name;
        this.lastName = last_name;
        this.email = email;
        this.photoUrl = photo_url;
        this.isAdmin = is_admin;
    }

    /** return array of user data:
     * 
     * => [{ username, first_name, last_name, email }, ... ]
     * 
     */

    static async all() {
        const result = await db.query(`SELECT username, first_name AS "firstName", last_name AS "lastName", email
            FROM users
            ORDER BY username`);

        return result.rows;
    }

    /** register new user:
     * 
     * username, password, first_name, last_name, email, photo_url, is_admin
     *  => User { username, first_name, last_name, email, photo_url, is_admin }
     * 
     */

    static async register(username, password, firstName, lastName, email, photoUrl, isAdmin = false) {
        const userResult = await db.query(`SELECT username FROM users
            WHERE username = $1`,
            [username]);

        if (userResult.rowCount != 0) {
            throw new ExpressError(`Username ${username} already exists`, 400);
        } else {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
            const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING username, first_name, last_name, email, photo_url, is_admin`,
                [username, hashedPassword, firstName, lastName, email, photoUrl, isAdmin]);
            const newUser = new User(result.rows[0]);
            return newUser;
        }
    }

    /** authenticate user
     * 
     * username, password => authenticated
     * 
     */

    static async authenticate(username, password) {
        const result = await db.query(`SELECT password FROM users
            WHERE username = $1`,
            [username]);

        if (result.rowCount === 0) {
            throw new ExpressError(`User ${username} not found`, 404);
        } else {
            const hashedPassword = result.rows[0].password;
            const authenticated = await bcrypt.compare(password, hashedPassword);
            return authenticated;
        }
    }

    /** get user by username:
     * 
     * => User { username, first_name, last_name, email, photo_url }
     * 
     */

    static async get(username) {
        const result = await db.query(`SELECT username, first_name, last_name, email, photo_url FROM users
            WHERE username = $1`,
            [username]);

        if (result.rowCount === 0) {
            throw new ExpressError(`User ${username} not found`, 404);
        } else {
            const user = new User(result.rows[0]);
            return user;
        }
    }

    /** update user information:
     * 
     * username, { password, first_name, last_name, email, photo_url }
     *  => User { username, first_name, last_name, email, photo_url }
     * 
     */

    static async update(username, newInfo) {
        if (newInfo.firstName) {
            newInfo.first_name = newInfo.firstName;
            delete newInfo.firstName;
        }
        if (newInfo.lastName) {
            newInfo.last_name = newInfo.lastName;
            delete newInfo.lastName;
        }
        if (newInfo.photoUrl) {
            newInfo.photo_url = newInfo.photoUrl;
            delete newInfo.photoUrl;
        }
        if (newInfo.password) {
            const hashedPassword = await bcrypt.hash(newInfo.password, BCRYPT_WORK_FACTOR);
            newInfo.password = hashedPassword;
        }

        const queryObject = sqlForPartialUpdate('users', newInfo, 'username', username);
        const result = await db.query(queryObject.query, queryObject.values);

        if (result.rowCount === 0) {
            throw new ExpressError(`User ${username} not found`, 404);
        } else {
            const user = new User(result.rows[0]);
            return user;
        }
    }

    /** delete user:
     * 
     * => 'User deleted'
     * 
     */

    static async delete(username) {
        const result = await db.query(`DELETE FROM users
            WHERE username = $1`,
            [username]);

        if (result.rowCount === 0) {
            throw new ExpressError(`User ${username} not found`, 404);
        } else {
            return 'User deleted';
        }
    }

}

module.exports = User;