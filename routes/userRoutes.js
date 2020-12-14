const express = require("express");
const User = require("../models/user");

const jsonschema = require("jsonschema");
const addUserSchema = require("../schemas/user/addUserSchema.json");
const updateUserSchema = require("../schemas/user/updateUserSchema.json");

const ExpressError = require("../helpers/expressError");

const router = new express.Router();

/** GET / => { users: [{ username, first_name, last_name, email }, ... ]} */

router.get('/', async (request, response, next) => {
    try {
        const users = await User.all();
        return response.json({ users: users });
    } catch (err) {
        return next(err);
    }
});

/** POST / { username, password, first_name, last_name, email, photo_url }
 *      => { user: { username, first_name, last_name, email, photo_url } }
 */

router.post('/', async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, addUserSchema);

        if (result.valid) {
            const { username, password, firstName, lastName, email, photoUrl } = request.body;
            const newUser = await User.register(username, password, firstName, lastName, email, photoUrl);
            return response.json({ user: newUser });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** GET /:username => { user: { username, first_name, last_name, email, photo_url } } */

router.get('/:username', async (request, response, next) => {
    try {
        const user = await User.get(request.params.username);
        return response.json({ user: user });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:username { password, first_name, last_name, email, photo_url }
 *      => { user: { username, first_name, last_name, email, photo_url } }
 */

router.patch('/:username', async (request, response, next) => {
    try {
        const result = jsonschema.validate(request.body, updateUserSchema);

        if (result.valid) {
            const updatedUser = await User.update(request.params.username, request.body);
            return response.json({ user: updatedUser });
        } else {
            const listOfErrors = result.errors.map(error => error.stack);
            throw new ExpressError(listOfErrors, 400);
        }
    } catch (err) {
        return next(err);
    }
});

/** DELETE /:id => { message: 'User deleted' } */

router.delete('/:username', async (request, response, next) => {
    try {
        const message = await User.delete(request.params.username);
        return response.json({ message: message });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;