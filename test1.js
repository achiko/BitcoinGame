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
          user: 'bitcoinrpc',
          pass: '3VXSDdC69sQnd9c6xur1Nx77S7gyFwcc3ZFmJDfyt6cM'
 });




 var obj = [];
      client.cmd('listaccounts', 0 , function(err, accs){
             
              _.map(accs , function(amt , acc){                     
                    
                    client.cmd('getaddressesbyaccount', acc, function(err, addr){
                        
                        client.cmd('getbalance', acc, 0, function(err, balance){
                              
                              if(balance !== 0)
                              {
                                console.log('Acc:  ' + acc , 'Address: ' + addr , 'Amount: ' + amt, 'Balance: ', balance);                            
                              }
                              //        obj.push({ 
                              //             "Acc"     : acc,
                              //             "Address" : addr,
                              //             "Amount"  : amt,
                              //             "Balance" : balance   
                              //         });

                        });     

                    });                 
                    
              });
      });



 
// var _Accounts = [];

//  client.cmd('listaccounts', 0 , function(err, accs){
//               _.map(accs , function(amt , acc){               			
//               			client.cmd('getaccountaddress', acc, function(err, addr){
//               					client.cmd('getbalance', acc, 0, function(err, balance){
//               								console.log('Acc:  ' + acc , 'Address: ' + addr , 'Amount: ' + amt, 'Balance: ', balance);               							
//               					});              					              					
//               			});              		
//               });
//  });



// client.cmd('getinfo', function(err, res){

//       console.log(res);

// });



 // client.cmd('getbalance',  function(err, totalbalance){
 //     		console.log('Total balance: ', totalbalance);
 //  });         

// Acc:  7XSNh Address: mndaDsHmzfwsi6eU3W3Mya6CZ6oteo3MeP Amount: 0 Balance:  0
// Acc:  F4j9t Address: miN2fRiAuQYfVYSEFFrF51qpgYEcB9oYcL Amount: 0 Balance:  0

var from 	= '5fZT3';
var to 		= 'F4j9t';

// client.cmd('move', from, to, 0.01, 0, 'Move Money', function(err, result){
// 			console.log(err);
// 			console.log(result);
// });


// client.cmd('getbalance', to, 0,   function(err, totalbalance){     	
//      		console.log('Acct Balance: ', totalbalance);
// });  


// // Send Form !!! 
// client.cmd('sendfrom', to, 'mndaDsHmzfwsi6eU3W3Mya6CZ6oteo3MeP', 0.01,  0, function(err, txid) {
// 			console.log(err);
// 			console.log(txid);
// });


// var numbers = [10, 5, 100, 2, 1000];
// var minValue =  _.min(numbers);

// console.log(minValue);



//logger.log('info', 'test message %s, %s', 'first', 'second', {number: 123});
//logger.log('Error', 'Error %s, %s', 'Error Text: ', 'Error Code: ', '{ [Error: Transaction amount too small] code: -4 }' );
