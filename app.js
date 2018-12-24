const express = require('express');
const auth_routes = require('./routes/auth-routes');
const car_routes = require('./routes/car-routes');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const errorHandlers = require('./handlers/errorHandlers');

const app = express();
app.use(cors());

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
app.use(express.static(path.join(__dirname, 'public')));

// Takes the raw requests and turns them into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// After allllll that above middleware, we finally handle our own routes!
app.use('/api/auth', auth_routes);
app.use('/api/car', car_routes);

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

module.exports = app;
