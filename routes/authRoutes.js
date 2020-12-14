const express = require("express");
const User = require("../models/user");
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require("../config");

const ExpressError = require("../helpers/expressError");

const router = new express.Router();

/** POST /login
 * 
 * username, password => { token: token }
 * 
 */

router.post('/login', async (request, response, next) => {
    try {
        const { username, password } = request.body;
        const authenticated = await User.authenticate(username, password);

        if (authenticated) {
            const payload = { username: username };
            const token = jwt.sign(payload, SECRET_KEY);
            return response.json({ token: token });
        } else {
            throw new ExpressError('Invalid password', 400);
        }
    } catch (err) {
        return next(err);
    }
});

module.exports = router;