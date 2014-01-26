var mongoose		= require('mongoose');
var async				= require('async');
var _						= require('underscore');
var fs					= require('fs');
var winston 		= require('winston');
var util 				= require('util');


var logger = new (winston.Logger)({
    
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'transactions.log' })
    ]
 
});


// 1. get transactionID txn
// 2. get Wallet infor by transaction :  btcAddress, acct
// 3. get user session via Users Collection
// 5. Push User via User Session on Socket chanel infor about transaction  // Aqdan davitskot 

exports.GetTransaction = function(db, Models, client, txn,  callback)
{
			var  TransactionObject = null;
			
			var _SenderBTCAdress = null;
			var _SenderBTCAccount = null;
			var _ReciverBTCAdress = null;
			var _ReciverBTCAccount = null;
			var _DeliveryStatus = null;

			var _UserBalance = 0.0;
			var _UserSession = null;


			async.series([


					// 1. get transactionID txn
			    function(callback){
			        
			    			client.cmd('gettransaction', txn , function (err, transaction) {

				            if (err) 	{ 
		              			
		              			logger.log('Error Get Transaction ', err);  
		              			logger.info('Error Get Transaction', err);  
		              			
		              			return  callback(err, 400); 
				            }

					            //-- logger.info('Transaction results', transaction);
					            //-- logger.log('Transaction results', transaction);
			 							  
			 							  TransactionObject = transaction;
			 							  console.log('Transdetails: ', TransactionObject.details);
						          callback(null, 300);

				       });
			        
			    },

			  
			    // 2. get Wallet infor by transaction :  btcAddress, acct
			    function(callback){

			    		Models.transactions.findOne({ Txn: txn }, function (err, doc) {

			    					if(err) {  console.log(err);  return callback(err, 402); };

			    					console.log('Doc Found ?', doc);

			    					if(!doc)
			    					{

									    	var transactionData = new  Models.transactions({


																Txn: 					txn,
																Time: 				TransactionObject.time,
																Timerecived: 	TransactionObject.timereceived,
																Acc:  				TransactionObject.details[0].account,
																Address: 			TransactionObject.details[0].address,
																Amount: 			TransactionObject.details[0].amount,
																Operation: 		TransactionObject.details[0].category, // Send recive 
																InfoDeliveryStatus: 0

													});


													transactionData.save(function(err, doc){

															if(err) {  console.log(err); return callback(err, 402) };
															_DeliveryStatus = doc.InfoDeliveryStatus;
															callback(null, 301);

													});

			    					}else{

			    						 	callback(null, 302);  // 302 Means  document exitts 
			    					}

			    		});
										       
			       //-- callback(null, 301);
			    },

			    function(callback){
			    		
			    		console.log('Find User by BTC: ',  TransactionObject.details[0].account);

			    		Models.users.findOne({ BTCAccount: TransactionObject.details[0].account }, function(err, doc){

			    						 if(err) {  return callback(err, 403); }
			    						 
			    						 if(!doc) { return callback(403,403); } // User not found!!!

			    						_UserSession = doc.UserSession;

			    						callback(null, 303);
			    		});

			    },

			    function(callback)
			    {

			    			client.cmd('getbalance', TransactionObject.details[0].account, 0, function(err, balance){

			    					if(err) {  return callback(err, 404) };

			    					_UserBalance = balance;
			    					callback(null, 304);

			    			});

			    }


			],

			//Final Callbacl Collect all statuses 
			function(err, results){

					var data = {};

					console.log(results);

					if(err)
					{
							data = {ErrorCode: 1};
							return  callback(data);
					}

			  	data = 
			  	{ 
			  					"ErrorCode: "					: 0,
			  					"UserSession"					: _UserSession, 
			  					"SenderBTCAddress"		: TransactionObject.details[0].address, 
			  					"ReciverBTCAddress"		: TransactionObject.details[0].address, 
			  					"Amount"							: TransactionObject.details[0].amount,
			  					"CurrentBalance"			:  _UserBalance,
			  					"DeliveryStatus"			: _DeliveryStatus,
			  					"txn"									:  txn
			  	}

			   	//-- console.log('Fider result: ', results);
			   	callback(null, data)

			});

}
