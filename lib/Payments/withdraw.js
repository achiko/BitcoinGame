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


//-- Required params:  1. BitcoinAddress, 2. Amount.  3. Senders Address and Account 

// 1. Get Sender Account (via session) 
// 2. Get Sender Account Amount
// 3. Check Amount is Enough ? (May in transactions we dont need to Chek ? )
// 4. Make Transfer - get transaction ID
// 5. Insert Information in database: 


exports.WithdrawBtc = function(db, Models, client, SessionID, reciverBtcAddress, callback)
{

			var  TransactionObject = null;
			
			var _SenderBTCAdress = null;
			var _SenderBTCAccount = null;
			var _SendingAmount = null;
			var _ReciverBTCAdress = reciverBtcAddress;
			var _TransactionId = null;

			var _TransactionErrorCode  = null;
			var _DeliveryStatus = null;
			var _CurrentBalance = null;
			

			async.series([

						// 1. Get Sender Account (via session) 
				    function(callback){
												        			    				    			
				    			Models.users.findOne({ UserSession: SessionID }, function(err, doc){

									console.log('Session: ', SessionID , 'BTC: ', doc.BTCAdress);
									
									if(err){

											logger.log('0:  Session database Error: ', 200);
											logger.info('0:  Session database Error: ', 200);
											return callback(err, 200);
									}

									if(doc.BTCAdress === undefined){  

											logger.log('0:  Session Not Found: ', 200);
											logger.info('0:  Session Not Found: ', 200);
											return callback(err, 200);
									}

									logger.log('0:  Session Found: Btc Address is: ', doc.BTCAdress, 'Acc: ', doc.BTCAccount);									
									logger.info('0: Session Found: Btc Address is: ', doc.BTCAdress, 'Acc: ', doc.BTCAccount);									

									_SenderBTCAdress = doc.BTCAdress;
									_SenderBTCAccount = doc.BTCAccount;

									callback(null, 100); 

							});


				    },
				  

				    // 2. Get Sender Account Amount // Check Confirmations ??? hmmmmm !!!! 
				    function(callback){

				    		client.cmd('getbalance', _SenderBTCAccount, 2, function (err, balance) {

				            if (err) 	{ 
		              			
		              			logger.log('Error Get Balance ', err);  
		              			logger.info('Error Get Balance', err);  
		              			
		              			return  callback(err, 201); 
				            }

				            if(balance <= 0)
				            {
				            	console.log('Balance is  equal zeroooo ');
				            	return 	callback(201, 201);
				            }

					           logger.info('Balance results', 	balance);
					           logger.log('Balance results', 		balance);
			 							 
			 							 _SendingAmount = balance;

						         callback(null, 101);
				       });

					},

					 // 4. Make Transfer - get transaction ID
				   function(callback){
				   				
				   		console.log('===========================================');
				   		console.log('Sender Acct: ', _SenderBTCAccount);
				   		console.log('reciever Address ', _ReciverBTCAdress);
				   		console.log('Sending Amount ', _SendingAmount );
				   		console.log('===========================================');

				   		// moQLBPTtGV6xZeS1sVWsWykU83YpWEQWAR

							client.cmd('sendfrom', _SenderBTCAccount, _ReciverBTCAdress, _SendingAmount, 2,  function (err, txnid) {

				            if (err) 	{ 		              			
		              			
		              			logger.log('Error Send BTC ', err);  
		              			logger.info('Error Send BTC', err);  
		              			
		              			_TransactionErrorCode = err;
		              			return  callback(err, 203); 
				            }
				          	
				          	_TransactionId = txnid;
				          	_TransactionErrorCode = 0;

					           logger.info('Transactionb succsess', 	txnid);
					           logger.log('Transaction succsess', 		txnid);
			 							  
						         callback(null, 103);
				       });

				   },
				   
				   // Insert Data  Into database 
				   function(callback)  {

					    	var transactionData = new  Models.transactions({

												Txn: 					_TransactionId,
												Time: 				Date.Now,
												Timerecived: 	Date.Now,
												Acc:  				_SenderBTCAccount,
												Address: 			_SenderBTCAdress,
												Amount: 			_SendingAmount,
												Operation: 		'send', // Send recive 
												InfoDeliveryStatus: 1,
												RecieverAddress:   _ReciverBTCAdress

									});

									transactionData.save(function(err, doc){
											if(err) {  console.log(err);  };												
									});

						   		callback(null, 104);

				   },

				   function(callback)
				   {

				   			client.cmd('getbalance', _SenderBTCAccount, 2, function (err, balance) {

				            if (err) 	{ 
		              			
		              			logger.log('Error Get Balance ', err);  
		              			logger.info('Error Get Balance', err);  
		              			
		              			return  callback(err, 201); 
				            }


					           logger.info('Balance results', 	balance);
					           logger.log('Balance results', 		balance);
			 							 
			 							 _CurrentBalance = balance;

						         callback(null, 101);
				       });


				   }

			],

			//-- Final Callbacl Collect all statuses 
			function(err, results){

					console.log(results);
					var data = {};

					if(err)
					{
							data = { Errorcode:  _.max(results)  };
							return callback(null, data);
					}
				

				 data = 
				 { 
							Errorcode: 0,
							SendAmount:   		_SendingAmount,
							TransErrorCode:   _TransactionErrorCode,
							CurentBalance:   _CurrentBalance,

				 };

			   	//-- console.log('Fider result: ', results);
			   	callback(null, data)

			});

}

