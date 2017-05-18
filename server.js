var express = require('express');
var app = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var cors = require('cors');


var conf = require('./conf');
var user = require('./routes/user');


mongoose.Promise = global.Promise;
//var connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
//	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
//	process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
//	process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
//	process.env.OPENSHIFT_APP_NAME;
//mongoose.connect('mongodb://' + connection_string)
mongoose.connect('mongodb://127.0.0.1:27017/autismtracker')
	.then(function () {
		console.log('Connected to MONGOD !!');
	}).catch(function (err) {
		console.log('Failed to establish connection with MONGOD !!');
		console.log(err.message);
	});


app.use(morgan('dev'));
app.use(cors());


app.use('/api/user', user);

app.get('/*', function (req, res) {
	res.json('hello');
});


app.listen(conf.PORT, conf.IP);
console.log('Server running on ' + conf.IP + ':' + conf.PORT);
