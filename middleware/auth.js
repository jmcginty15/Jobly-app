const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

function authenticateJWT(request, response, next) {
    try {
        const token = request.body._token;
        const payload = jwt.verify(token, SECRET_KEY);
        request.user = payload;
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(request, response, next) {
    if (!request.user) {
        return next({ status: 401, message: "Unauthorized" });
    } else {
        return next();
    }
}

/** Middleware: Requires correct username. */

function ensureCorrectUser(request, response, next) {
    try {
        if (request.user.username === request.params.username) {
            return next();
        } else {
            return next({ status: 401, message: "Unauthorized" });
        }
    } catch (err) {
        return next({ status: 401, message: "Unauthorized" });
    }
}

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUser
};
