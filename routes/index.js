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
	db.run("CREATE TABLE IF NOT EXISTS 'accounts' (email varchar(50) PRIMARY KEY NOT NULL, firstname varchar(50) NOT NULL, lastname varchar(50) NOT NULL, dateofbirth DATE NOT NULL, password varchar(255) NOT NULL, money REAL)", function(err) {
		if(err) {
			winston.error(err);
		} else {
			winston.info("Created table successfully");
		}
	});
});

/* GET home page. */
router.get('/', function(req, res, next) {
	if(req.session.loggedin){
		res.render('homelogin', { title: 'Home' } );
	} else {
		res.render('home', { title: 'Home' } );
	}
});

router.get('/profile', function(req, res, next) {
	if(req.session.loggedin) {
		var balance=0;
		db.get("SELECT money FROM accounts WHERE email=?", req.session.email, function(error, result) {
			if(error){
				winston.error(error);
				res.render('profile', { title: 'Error retrieving balance' } );
			} else {
				res.render('profile', { title: (req.session.name).charAt(0).toUpperCase() + req.session.name.substring(1), displaybalance: result.money } );
			}
		});
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

router.get('/logout', function(req, res, next) {
	req.session.loggedin = false;
	req.session.email = null;
	req.session.name = null;
	res.redirect('/');
});

router.post('/creationauthenticate', function(req, res) {
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var birthDate = req.body.birthDate;
	var email = req.body.email;
	
	firstName = firstName.toLowerCase();
	lastName = lastName.toLowerCase();
	email = email.toLowerCase();
	
	if(req.body.password == req.body.confirmPassword){
		var password = req.body.password;
	} else {
		res.render('createaccount', { title: 'Passwords do not match' } );
		res.end();
	}
	
	if(firstName && lastName && birthDate && email && password) {
		db.run("INSERT INTO accounts (email, firstname, lastname, dateofbirth, password, money) VALUES (?,?,?,?,?,?)", email, firstName, lastName, birthDate, password, 100.69, function(error) {
			if(error) {
				if(error.errno == 19) {
					winston.error(error);
					res.render('createaccount', { title: 'Sorry, that email is already in use' } );
				} else {
					winston.error(error);
					res.render('createaccount', { title: 'Sorry, there was a problem' } );
				}
			} else {
				req.session.loggedin = true;
				req.session.email = email;
				req.session.name = firstName;
				res.redirect('/profile');
			}
		});
	} else {
		res.render('createaccount', { title: 'Please ensure all fields are filled in' } );
	}
});

router.post('/authenticate', function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	
	email = email.toLowerCase();
	
	if(email && password){
		db.get('SELECT * FROM accounts WHERE email = ? AND password = ?', [email, password], function(error, result) {
			//This is where the password and potentially email as well would be decrypted from the database, I might get around to that one day.
			if(error) {
				winston.error(error);
			} else {
				if(result) {
					req.session.loggedin = true;
					req.session.email = email;
					req.session.name = result.firstname;
					res.redirect('/profile');
				} else {
					res.render('login', { title: 'Login details do not match' } );
				}
			}
			res.end();
		});
	} else {
		res.render('login', { title: 'Please enter all details' } );
		res.end();
	}
});

router.post('/addmoney', function(req, res) {
	db.get('SELECT money FROM accounts WHERE email = ?', [(req.session.email).toLowerCase()], function(preerror, preresult) {
		if(preerror) {
			winston.error(preerror);
		} else {
			db.run('UPDATE accounts SET money = ? Where email = ?', [preresult.money+5, (req.session.email).toLowerCase()], function(error, result) {
				if(error) {
					console.log(error);
					winston.error(error);
				} else {
					res.render('profile', { title: '£5 added to your account', displaybalance: preresult.money+5 } );
				}
			});
		}
	});
});

module.exports = router;
