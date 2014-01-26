
var fs	= require('fs');



exports.log = function  (arg1, arg2) {

		var log = fs.createWriteStream('logs.txt', {'flags': 'a'}); 

 			log.end( arg1 + ' ' + arg2 ,  + "\n");

 		}






