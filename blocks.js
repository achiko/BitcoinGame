var async 			= require('async');
var fs					= require('fs');
var winston 		= require('winston');
var bitcoin     = require('bitcoin');
var _           = require('underscore');



var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  });

//-- generate Bitocin Adress
var client = new bitcoin.Client({

          host: 'localhost',
          //port: 8332,
          port: 18332,
          user: 'rpcuser',
          pass: 'testpass'
 });



 client.cmd('getblockcount',  function(err, blocks){

        if(err)  {  return console.log(err); }
     		console.log('Total Blocks Count is : ', blocks);

  });         

