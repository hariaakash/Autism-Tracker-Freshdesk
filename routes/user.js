var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var hat = require('hat');
var bcrypt = require('bcryptjs');
var request = require('request');
var User = require('../models/user');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));


app.get('/', function (req, res) {
	if (req.query.authKey) {
		User.findOne({
				authKey: req.query.authKey
			})
			.then(function (user) {
				if (user) {
					res.json({
						status: true,
						data: user
					});
				} else {
					res.json({
						status: false,
						msg: 'User associated with the email not found !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});


function sendImage(image, callback) {
	request({
		url: 'https://api.imgur.com/3/image',
		method: "POST",
		json: true,
		headers: {
			'Authorization': 'Client-ID a8cf7beef2a8602',
			'content-type': 'application/json',
		},
		body: {
			image: image,
			type: "base64"
		}
	}, function (error, response, body) {
		callback(body.data.link);
	});
}


function detectEmotion(oxford, callback) {
	var final = [0, 0, 0, 0, 0, 0, 0];
	var index = 0;
	final[0] = oxford.emotion.anger;
	final[1] = oxford.emotion.disgust;
	final[2] = oxford.emotion.fear;
	final[3] = oxford.emotion.happiness;
	final[4] = oxford.emotion.neutral;
	final[5] = oxford.emotion.sadness;
	final[6] = oxford.emotion.surprise;
	var max = 0;
	for (j = 0; j < final.length; j++) {
		if (max < final[j]) {
			max = final[j];
			index = j;
		}
		if (j == 6)
			callback(max, index);
	}
}

function findEmotion(link, callback) {
	request({
		url: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
		method: "POST",
		json: true,
		headers: {
			'Ocp-Apim-Subscription-Key': 'f1c9d66c654247acbdd968b2c506e744',
			'content-type': 'application/json',
		},
		body: {
			url: link
		}
	}, function (err, res, body) {
		callback(body[0].scores);
	});
}


app.post('/register', function (req, res) {
	if (req.body.email && req.body.password) {
		User.findOne({
				email: req.body.email
			})
			.then(function (user) {
				if (!user) {
					bcrypt.hash(req.body.password, 10, function (err, hash) {
						var user = new User();
						user.email = req.body.email;
						user.password = hash;
						user.save()
							.then(function (user) {
								res.json({
									status: true,
									msg: 'Successfully Registered !!'
								});
							});
					});
				} else {
					res.json({
						status: false,
						msg: 'Email is already registered !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});

app.post('/login', function (req, res) {
	if (req.body.email && req.body.password) {
		User.findOne({
				email: req.body.email
			})
			.then(function (user) {
				if (user) {
					bcrypt.compare(req.body.password, user.password, function (err, response) {
						if (response == true) {
							user.authKey = hat();
							user.save();
							res.json({
								status: true,
								authKey: user.authKey,
								msg: 'Successfully signed in !!'
							});
						} else {
							res.json({
								status: false,
								msg: 'Password Wrong'
							});
						}
					});
				} else {
					res.json({
						status: false,
						msg: 'User associated with the email not found !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});

app.post('/addDevice', function (req, res) {
	if (req.body.authKey && req.body.imei) {
		User.findOne({
				authKey: req.body.authKey
			})
			.then(function (user) {
				if (user) {
					user.device = req.body.imei;
					user.save();
					res.json({
						status: true,
						msg: 'Device added successfully !!'
					});
				} else {
					res.json({
						status: false,
						msg: 'Invalid Credentials !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});

app.post('/detectEmotion', function (req, res) {
	if (req.body.authKey && req.body.img) {
		User.findOne({
				authKey: req.body.authKey
			})
			.then(function (user) {
				if (user) {
					var img = req.body.img;
					var oxford = {};
					sendImage(img, function (link) {
						findEmotion(link, function (emotion) {
							oxford.photo = link;
							oxford.emotion = emotion;
							res.json({
								status: true
							});
							detectEmotion(oxford, function (final, index) {
								user.data.push({
									oxford: oxford,
									final: final,
									label: index
								});
								user.count.images++;
								user.save();
								console.log('Saved');
							});
						});
					});
				} else {
					res.json({
						status: false,
						msg: 'Invalid Credentials !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});

app.post('/addSetting', function (req, res) {
	if (req.body.authKey && req.body.type && req.body.data) {
		User.findOne({
				authKey: req.body.authKey
			})
			.then(function (user) {
				if (user) {
					user.settings.push({
						type: req.body.type,
						data: req.body.data
					});
					user.save();
					res.json({
						status: true,
						msg: 'Settings added successfully !!'
					});
				} else {
					res.json({
						status: false,
						msg: 'Invalid Credentials !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});

app.post('/update', function (req, res) {
	if (req.body.authKey) {
		User.findOne({
				authKey: req.body.authKey
			})
			.then(function (user) {
				if (user) {
					user.imei = 357631050052050;
					user.count.images = 5;
					user.count.actions = 2;
					user.settings.push({
						type: 1,
						data: "https://www.youtube.com/watch?v=YqeW9_5kURI"
					});
					user.save();
					res.json({
						status: true,
						msg: 'Update done successfully !!'
					});
				} else {
					res.json({
						status: false,
						msg: 'Invalid Credentials !!'
					});
				}
			})
			.catch(function (err) {
				console.log(err);
				res.json({
					status: false,
					msg: 'Server not responding!!'
				});
			});
	} else {
		res.json({
			status: false,
			msg: 'Empty Fields'
		});
	}
});


module.exports = app;
