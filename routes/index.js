var express = require('express');
var router = express.Router();
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var winston = require('../config/winston');

const dbPath = path.resolve(__dirname, "../db/accounts.db");

console.log(dbPath);

let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, function(err) {
	if(err) {
		winston.error(err);
	} else {
		winston.info("Successfully opened database.");
	}
});

db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS 'accounts' ('email' varchar(50) PRIMARY KEY NOT NULL, 'password' varchar(255) NOT NULL, 'money' INTEGER)", function(err) {
		if(err) {
			winston.error(err);
		} else {
			winston.info("Created table successfully");
		}
	});
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('home', { title: 'Home' } );
});

router.get('/profile', function(req, res, next) {
	if(req.session.loggedin) {
	res.render('profile', { title: 'req.session.name' } );
	} else {
		res.redirect('/login');
	}
});

router.get('/create-account', function(req, res, next) {
	if(req.session.loggedin){
		res.redirect('/profile');
	} else {
		res.render('createaccount', {title: 'Create Account' } );
	}
});

router.get('/login', function(req, res, next) {
	if(req.session.loggedin){
		res.redirect('/profile');
	} else {
		res.render('login', {title: 'Log In' } );
	}
});

router.post('/authenticate', function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	if(email && password){
		db.get('SELECT * FROM accounts WHERE email = ? AND password = ?', [email, password], function(error, result) {
			//This is where the password and potentially email as well would be decrypted from the database, I might get around to that one day.
			if(error) {
				winston.error(error);
			} else {
				if(result) {
					req.session.loggedin = true;
					req.session.email = email;
					req.session.name = result.name;
					res.redirect('/');
				} else {
					res.send("Incorrect email and/or password!");
				}
			}
			res.end();
		});
	} else {
		res.send("Please ensure all fields are filled in!");
		res.end();
	}
});

module.exports = router;
