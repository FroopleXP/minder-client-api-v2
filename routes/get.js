// Dependencies
var config = require('../config/settings.js'),
    db = require('../mysql/mysql_conn.js');

// GET Requests
module.exports.home = function(req, res) {
    res.status(200).send({
        success: true,
        message: "Welcome to " + config.app.name
    });
}

module.exports.tasks = function(req, res) {
    // Getting the User ID
	var user_id = req.user.id;
	// Getting info about the user
	db.query('select tasks.id "task_id", tasks.date_due "due_date", tasks.task_name "task_name", tasks.task_desc "task_desc", classes.class_name "class_name", classes.id "class_id" from tasks, classes where tasks.class_id = classes.id and tasks.class_id in (select classes.id from classes where classes.id in (select relations.class_id from relations where relations.student_id in (select std_users.stu_id from std_users where std_users.stu_id like ?)))', user_id, function(err, rows, fields) {
		if (rows.length > 0) {
            res.status(200).send({
                status: true,
                tasks: rows
            });
		} else if (rows.length < 1) {
            res.status(200).send({
                status: false,
                message: "You currently have no tasks."
            });
		}
	});
}

module.exports.estabs = function(req, res) {
	// Getting the establishments
	db.query("SELECT estab_id, estab_name FROM establishments", function(err, rows, fields) {
		// Checking for errors
		if (err) throw err;
		// Sending back the data
		res.json(rows);
	});
}
