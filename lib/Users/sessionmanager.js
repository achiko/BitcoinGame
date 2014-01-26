var mongoose 	= require('mongoose');
var async			= require('async');
var winston 	= require('winston');


var log = new (winston.Logger)({
    
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'sessions.log' })
    ]
 
});


	// var Models = require('../Models/Users.js')(mongoose);

	//-- Get User Balance Function 
	getuserBalanceFromBtc = function(client, wallet, callback)
	{
				 var wallet = wallet;
				 var errorcode  = 0;

	       client.cmd('getaccount', wallet, function (err, acc) {
	           if (err || !acc) {
	               if (err) {
	                   console.log(err);
	                   callback(-1, null);
	               }
	               
	           }else{
	       
	               client.cmd('getbalance', acc, 0 , function (err, balance) {
	                  if (err) {
	                      console.log(err);
	                      callback(-2, null); //
	                  		}  else {
	                      callback(0, balance);
	                  }
	               });
	           }
	       });
	}



//-- Get User BTC addres by Session 
exports.getUserBySession = function(db, Models, client, SessionID, callback)
{
			//db.users.find({UserSession: "999a42c0-65b0-11e3-bad8-f58e614d76a9" });
			// var query = Models.users.find({ UserSession: session }, { BTCAdress: 1, balance: 1, _id: 0 } );
			// query.exec(function (err, doc) {						
			// 			callback(doc);
			// });

			var _PlayerWalletAccount 	= null;
			var _UserName  						= null;
			var _UserBtcAddress 			= null;
			var _UserBalance 					= null;

			var response = {};
			
			async.series([

					function(callback)
					{	
							Models.users.findOne({ UserSession: SessionID }, function(err, doc){
																		
									if(err){																				
											
											return callback(err, 200);
									}

									if(doc === null){
											
											return callback(err, 200);	
									}

									if(doc.BTCAdress === undefined){  										
											
											return callback(err, 200);
									}

									//log.log('0:  Session Found: Btc Address is: ', doc.BTCAdress);									
									//log.info('0: Session Found: Btc Address is: ', doc.BTCAdress);									

									console.log('Session: ', SessionID , 'BTC: ', doc.BTCAdress);									
									_UserBtcAddress = doc.BTCAdress;
									_username 			= doc.UserName;

									callback(null, 100); 
							});
					},

					//-- 1. Get Player BTC Account From Bticoin Wallet Succsess Code = 101, Error Code: 201 // Cant Accses Wallet			
					function(callback)
					{
							client.cmd('getaccount', _UserBtcAddress, function (err, acc) {
	           				
			          		if (err)  { 		         					
			        						log.log('1. Error Get Player Account From Bticoin Wallet', err); 
													log.info('1. Error Get Player Account From Bticoin Wallet', err); 

			        						return callback(err, '201');  
		          			}						

			          		//log.info('1. Get Player Account From Bticoin Wallet: ', acc);
			          		//log.log('1. Get Player Account From Bticoin Wallet: ',  acc);
			          		
			          		_PlayerWalletAccount = acc;
			          		callback(null, 101);
							});
				 	},

				 //-- 2. Get Player BTC Balance From Bticoin Wallet //-- Succsess Code = 102, Error Code: 202 // Cant get user Balance	
				 function(callback)
				 { 
				 			client.cmd('getbalance', _PlayerWalletAccount, 0 , function (err, balance) {

				            if (err) 	{ 
		              			log.log('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			log.info('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			return  callback(err, '202'); 
				            }

					            //log.info('2. Get Player Balance From Bticoin Wallet: Balance =', balance);
			 							  //log.log('2. Get Player Balance From Bticoin Wallet: Balance = ', 	balance);

			 							  _UserBalance = balance;

						          callback(null, 102);
				       });
				 }
				],
				function(err, results){

							if(err) { response = { "ErrorCode": 100 };   callback(null, response ); }

    					console.log(results);
    					response = {

    								"ErrorCode": 0,
    								"UserName":  _UserName,
    								"BTCAdress": _UserBtcAddress,
    								"BTCbalance": _UserBalance

    					};

    					//console.log('BTC response: ', response);
    					callback(null, response);
				});
}


//-- Save user 
exports.userssession  =  function(db, Models, client , _username, _usersession, callback) 
{
			 var errorcode = 0; // 0 == Ok
			 var id = makeid();
       
      
			 async.waterfall([

			 			function(callback)
			 			{
			 						client.cmd('getnewaddress', id, function (err, addr) {
       								
       									if(err){
       											
       											console.log(err);
       											return	callback(err,0);
       									}

       									callback(null, addr);
       						});
			 			},

			 			function(addr, callback)
			 			{

			 					client.cmd('getaccount', addr, function (err, account) {
       								
       									if(err){      
       											console.log(err); 												
       											return	callback(err,0);
       									}
       									callback(null, addr, account);
       						});	
			 			},

			 			function(addr, account, callback)
			 			{
			 					//-- Create user Model
								var user = new Models.users ({

												UserName 			:  _username, 
												UserSession 	:  _usersession,
												BTCAdress 		: 	addr,
												BTCAccount		:   account,
												balance				: 	0.0
								});

								console.log('User: ', user);

								//-- Save user
								user.save(function(err, doc){						

												if(err){		
														console.log(err);
														return	callback(err);
													}

											callback(null, addr);											

								});																	
			 			}

			 	]);
    
	}



 //BTC adress generator 
 function makeid()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    
        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));
    
        return text;

    }


