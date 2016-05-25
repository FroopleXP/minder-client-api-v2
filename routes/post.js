// Dependencies
var config = require('../config/settings.js'),
    db = require('../mysql/mysql_conn.js'),
    jwt = require('jsonwebtoken');

// POST Requests
module.exports.auth = function(req, res) {

    var email = req.body.email,
        password = req.body.password;

    // Checking the user in the database
    db.query("SELECT * FROM std_users WHERE std_users.stu_email = ?", email, function(err, rows, fields) {
        if (err) { // Checking for error
            throw err;
            res.status(500).send({
                status: false,
                message: "There was a problem with the database. Please try again later..."
            });

        } else if (!err) { // No error, check the user
            if (rows.length < 1) { // No user
                res.status(403).send({
                    status: false,
                    message: "Incorrect user credentials"
                });

            } else if (rows.length > 0) { // User exists
                // Getting the data
                var email_db = rows[0]['stu_email'],
                    password_db = rows[0]['stu_pass'];
                // Checking credentials
                if (email !== email_db) {
                    res.status(403).send({
                        status: false,
                        message: "Incorrect Email"
                    });

                } else if (password !== password_db) {
                    res.status(403).send({
                        status: false,
                        message: "Incorrect Password"
                    });

                } else {
                    // Creating a user model to sign
                    var user_model = {
                        id: rows[0]['stu_id'],
                        firstname: rows[0]['stu_fname'],
                        lastname: rows[0]['stu_lname'],
                        full_name: rows[0]['stu_full_name'],
                        email: rows[0]['stu_email'],
                        estab_id: rows[0]['stu_estab']
                    }

                    // Signing the token
                    var token  = jwt.sign(user_model, config.auth.secret, {
                        expiresIn: 18000
                    });

                    // Sending back the token
                    res.status(200).send({
                        status: true,
                        token: token
                    });

                }

            }

        }
    });

}
