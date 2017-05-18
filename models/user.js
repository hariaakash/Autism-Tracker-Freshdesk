var mongoose = require('mongoose');
var Schema = mongoose.Schema;


mongoose.Promise = global.Promise;


var userSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	device: Number,
	data: [{
		time: {
			type: Date,
			default: Date.now
		},
		oxford: [{
			photo: String,
			emotion: {
				anger: Number,
				disgust: Number,
				fear: Number,
				happiness: Number,
				neutral: Number,
				sadness: Number,
				surprise: Number
			}
		}],
		final: Number,
		label: Number
	}],
	settings: [{
		type: Number,
		data: String
	}],
	count: {
		images: {
			type: Number,
			default: 0
		},
		actions: {
			type: Number,
			default: 0
		}
	},
	authKey: String
});


module.exports = mongoose.model('User', userSchema);
