// Requiring dependencies
var express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    app = express();

// Configuration dependencies + routes
var config = require('./config/settings.js'),
    middleware = require('./routes/middleware.js'),
    _post = require('./routes/post.js'),
    _get = require('./routes/get.js');

// Setting up the app
var api = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({ origin: "http://localhost:8100" }));
app.use('/api', api);

// GET Routes
api.get('/', _get.home);
api.get('/tasks', middleware.auth_required, _get.tasks);

// POST Routes
api.post('/auth', _post.auth);

// Start the application
app.listen(config.app.port, function() {
    console.log(config.app.name + " has started on port: " + config.app.port);
});
