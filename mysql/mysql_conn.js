// Getting dependencies
var mysql = require('mysql'),
    config = require('../config/settings.js');

// Setting up the connection
var conn = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port
});

// Testing connection
conn.connect(function(err) {
    // Checking for errors
    if (err) {
        console.log("MySQL Failed to connect: " + err);
    } else {
        console.log("Connected to Database!");
    }
});

// Exporting the connection
module.exports = conn;
