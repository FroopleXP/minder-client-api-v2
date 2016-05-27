// Dependencies
var config = require('../config/settings.js'),
    jwt = require('jsonwebtoken');

// Middleware used to authenticate the user with every request
module.exports.auth_required = function(req, res, next) {

    // Checking that the user has an Auth token
    var get_token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (get_token) {
        // Verifying token
        jwt.verify(get_token, config.auth.secret, function(err, decoded) {

            console.log(err);

            if (err) {
                return res.status(401).send({
                    status: false,
                    message: "Failed to authenticate token"
                });
            } else {
                req.user = decoded;
                next();
            }
        });

    } else if (!get_token) {
        // No token provided
        return res.status(401).send({
            success: false,
            message: 'No auth token...'
        });
    }

}
