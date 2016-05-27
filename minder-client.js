// Requiring dependencies
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    cors = require('cors'),
    app = express();

// Configuration dependencies + routes
var config = require('./config/settings.js'),
    middleware = require('./routes/middleware.js'),
    db = require('./mysql/mysql_conn.js'),
    _post = require('./routes/post.js'),
    _get = require('./routes/get.js');

// Passport
var passport = require('passport'),
    passportLocal = require('passport-local');

// Cleaning tools
var xssFilters = require('xss-filters'),
    validator = require('validator');

// Cleaning settings
var vali_str_opt = {
    min: 5,
    max: 100
}

// Setting up the app
var api = express.Router();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
app.use(cookieParser());
app.use(expressSession({
	secret: config.auth.secret,
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 2592000000 * 12 // ~ 1 Year
    },
    rolling: true
}));
app.use("/views", express.static(__dirname + '/views'));
app.use('/api', api);

// Setting up Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(function(email, password, done) {
    db.query('SELECT * FROM std_users WHERE std_users.stu_email = ?', email, function(err, rows, fields) {
        if (err) { return done(err); } // There was an error
        if (rows.length < 1) { // No user
            return done(null, false, {message: 'User not found!'});
        } else if (rows.length > 0) { // There's a user

            // Getting the data
            var email_db = rows[0]['stu_email'],
                password_db = rows[0]['stu_pass'];

            // Checking the credentials
            if (email !== email_db) { // Email is not correct
                return done(null, false, {message: 'Invalid Email'});
            } else if (password !== password_db) { // Password is not correct
                return done(null, false, {message: 'Invalid Password'});
            } else {
                // Validation success, create the user model
                var user_model = {
                    id: rows[0]['stu_id'],
                    firstname: rows[0]['stu_fname'],
                    lastname: rows[0]['stu_lname'],
                    full_name: rows[0]['stu_full_name'],
                    email: rows[0]['stu_email'],
                    estab_id: rows[0]['stu_estab']
                }
                // Returning
                return done(null, user_model);
            }
        }
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.query('SELECT * FROM std_users WHERE std_users.stu_id = ?', id, function(err, rows, fields) {
        if (err) { return done(err); } // There was an error
        if (rows.length < 1) { // No user
            done(null, null);
        } else if (rows.length > 0) { // There's a user
            // Validation success, create the user model
            var user_model = {
                id: rows[0]['stu_id'],
                firstname: rows[0]['stu_fname'],
                lastname: rows[0]['stu_lname'],
                full_name: rows[0]['stu_full_name'],
                email: rows[0]['stu_email'],
                estab_id: rows[0]['stu_estab']
            }
            // Returning
            done(null, user_model);
        }
    });
});

// Custom middleware for checking that User is logged in to use the API
function ensureAuthenticationAPI(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else if (!req.isAuthenticated()) {
        res.sendStatus(403);
    }
}

// Home route
app.get('/', function(req, res) {
	// Checking if the User is logged in
	if (req.isAuthenticated()) {
		res.render("home", { title: "Minder Client - Home", user: req.user});
	} else if (!req.isAuthenticated()) {
		res.redirect("login");
	}
});

// Login route
app.get('/login', function(req, res) {
	// Checking if the User is logged in
	if (req.isAuthenticated()) {
		res.redirect('/');
	} else if (!req.isAuthenticated()) {
		res.render("login", { title: "Minder Client - Login" });
	}
});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        } else if (!user) {
            return res.render("login", { title: "Minder Client - Failed to login!", err_msg: info.message });
        } else {
            req.login(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect("/");
            });
        }
    })(req, res, next);
});

// Register Route
app.get('/register', function(req, res) {
	// Checking if the User is logged in
	if (!req.isAuthenticated()) {
		// Rendering the Register page
		res.render("register", { title: "Minder Client - Registration" });
	} else if (req.isAuthenticated()) {
		// Redirecting back to home page
		res.redirect("/");
	}
});

app.post('/register', function(req, res) {
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
									message: "You've successfully registered! <a href='/login'>Login</a>"
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
});

app.get('/tasks', ensureAuthenticationAPI, function(req, res) {
	// Getting the User ID
	var user_id = req.user.id;
	// Getting info about the user
	db.query('select tasks.id "task_id", tasks.task_name "task_name", tasks.task_desc "task_desc", classes.class_name "class_name", classes.id "class_id" from tasks, classes where tasks.class_id = classes.id and tasks.class_id in (select classes.id from classes where classes.id in (select relations.class_id from relations where relations.student_id in (select std_users.stu_id from std_users where std_users.stu_id like ?)))', user_id, function(err, rows, fields) {
		if (rows.length > 0) {
			res.json({
				status: 1,
				tasks: rows
			});
		} else {
			res.json({
				status: 0,
				warning: 'No tasks to get!'
			});
		}
	});
});

// GET Routes (API)
api.get('/tasks', middleware.auth_required, _get.tasks);
api.get('/estabs', _get.estabs);

// POST Routes (API)
api.post('/auth', _post.auth);

// Start the application
app.listen(config.app.port, function() {
    console.log(config.app.name + " has started on port: " + config.app.port);
});
