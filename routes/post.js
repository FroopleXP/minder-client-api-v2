// Dependencies
var config = require('../config/settings.js'),
    db = require('../mysql/mysql_conn.js'),
    jwt = require('jsonwebtoken');

// POST Requests
module.exports.auth = function(req, res) {

    var email = req.body.email,
        password = req.body.password;

    // Checking the user in the database
    db.query("SELECT * FROM std_users WHERE std_users.stu_email = ?", [email], function(err, rows, fields) {
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
                        expiresIn: "1y"
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

module.exports.register = function(req, res) {

	// Getting the data from the form
	var firstname = xssFilters.inHTMLData(req.body.firstname),
		lastname = xssFilters.inHTMLData(req.body.lastname),
		email = xssFilters.inHTMLData(req.body.email),
		password = xssFilters.inHTMLData(req.body.password),
		password_conf = xssFilters.inHTMLData(req.body.conf_password),
		estab_id = xssFilters.inHTMLData(req.body.school),
		estab_password = xssFilters.inHTMLData(req.body.estab_password);

	// Validating the Data
	if (validator.isNull(firstname) || validator.isNull(lastname) || validator.isNull(email) || validator.isNull(password) || validator.isNull(password_conf) || validator.isNull(estab_id) || validator.isNull(estab_password)) {
		res.json({
			stat: 0,
			message: "You must fill out all fields!"
		});

	} else if (!validator.isEmail(email)) {
		res.json({
			stat: 0,
			message: "Invalid Email"
		});

	} else if (password != password_conf) {
		res.json({
			stat: 0,
			message: "Passwords do not match"
		});

	} else if (!validator.isLength(password, vali_str_opt)) {
        res.json({
            stat: 0,
            message: "Password must be longer than " + vali_str_opt.min + " characters"
        });

	} else {

		// Checking that the Email address hasn't already been used
		db.query("SELECT std_users.stu_id FROM std_users WHERE std_users.stu_email = ?", email, function(err, rows, fields) {

			// Checking for errors
			if (err) throw err;

			// Checking for data
			if (rows.length < 1) {

				// There's no data! Email is not taken - Checking whether the Establishment exists
				db.query("SELECT establishments.estab_id FROM establishments WHERE establishments.estab_id = ? AND establishments.estab_pass = ?", [estab_id, estab_password], function(err, rows, fields) {

					// Checking for errors
					if (err) throw err;

					// Checking Data
					if (rows.length < 1) {

						// There's no data, the password is wrong
						res.json({
							stat: 0,
							message: "Password for your establishment is incorrect"
						});

					} else if (rows.length > 0) {

						// There's data, the password is correct - register the user
						// Creating the User model
						var full_name = firstname + " " + lastname;

						var user_model = {
							stu_id: null,
							stu_fname: firstname,
							stu_lname: lastname,
							stu_full_name: full_name,
							stu_sign_date: null,
							stu_estab: estab_id,
							stu_email: email,
							stu_pass: password
						}

						// Adding the User to the database
						db.query("INSERT INTO std_users SET ?", user_model, function(err, result) {

							// Checking for error
							if (err) throw err;

							// Checking if the addition was successfull
							if (result.affectedRows > 0) {
								// Success!
								res.json({
									stat: 1,
									message: "Registration Success! You may now login to the app or online at <a href='/login'>Online portal</a>"
								});
							} else if (result.affectedRows < 1) {
								// Failed
								res.json({
									stat: 0,
									message: "There was a problem registering your account. Please try again later!"
								});
							}

						});

					}

				});


			} else if (rows.length > 0) {

				// There's data, Email has been registered
				res.json({
					stat: 0,
					message: "That Email is already in use. Please try another."
				});

			}

		});

	}
}
