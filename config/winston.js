var winston = require('winston');
var appRoot = require('app-root-path');

var options = {
	file: {
		level: 'info',
		filename: 'logs/app.log',
		handleExceptions: true,
		json: true,
		maxsize: 5242880,
		maxFiles: 5,
		colorize: false,
	},
};

var logger = winston.createLogger({
	transports: [
		new winston.transports.File(options.file),
	],
	exitOnError: false,
});

logger.stream = {
	write: function(message, encoding){
		logger.info(message);
	},
};

module.exports = logger;