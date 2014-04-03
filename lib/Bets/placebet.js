var mongoose		= require('mongoose');
var async				= require('async');
var _						= require('underscore');
var fs					= require('fs');
var winston 		= require('winston');
var util = require('util');


var logger = new (winston.Logger)({
    
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'log.log' })
    ]
 
});


var mainbtcAcct 	= "6ouCF";

//-- Place Bet Function !!! 
exports.PlaceBet = function(db, Models, client, SessionID, currentcoefs, BetObj, BetData, callback) {
		
			//stopwatch.start();
			var _GameID;					
			var _SlipAmount;
			var _SlipWinAmount;
			var _StartBalance; 	// Balance Before Bet (Curent Balance) 
			var _FinalBalance;  // Balance After Bet 
			var _SessionID;
			var _PlayerBTCAdress;
			var _transactionId = 'N/A';

			var _BetCoef 			= currentcoefs[BetObj.id];


			_GameID 					=  	BetData.gameID;
			_SlipAmount 			= 	BetObj.amt;
			_SlipWinAmount 		= 	_BetCoef * BetObj.amt; 
			_StartBalance 		= 	0;

			_PlayerWalletAccount 	= null;
			_MainWalletAccount 		= mainbtcAcct;
			_MainWalletBalabce 		= 0.00000;

			var _StartDate = null;
			var _EndDate = null;


		async.series([	    

					//-- get all wallets from beginong ..... ??? 
					//-- 0 Get Client BTC Addres Via SessionID from users collections //-- Succsess Code = 100, Error Code: 200 

					//-- 1. Get Player Account From Bticoin Wallet 			//-- Succsess Code = 101, Error Code: 201 // Cant Accses Wallet
					//-- 2. Get Player balance From Bticoin Wallet 			//-- Succsess Code = 102, Error Code: 202 // Cant get user Balance					
					//-- 3. Check If(PlayerBalance >= BetAmount)  			//-- Succsess Code = 103 (Balance is Ok), Error Code: 203 // Not Enough balance
					//-- 4. Make Transfer: PlayerWallet --> MainWallet, Transfer Amt: BetAmount //-- Succsess Code = 104, Error Code: 204 // Cant Transfer Money 
					//-- 5. Calculate User Win: 

					//  Player Loss (Do Nothing)					
					//  Player Wins? Start Transaction !!!

					//-- 6. Get MainWalletAcount From BitcoinWallet  		//-- Succsess Code = 106, Error Code: 206 // Cant Accses Wallet
					//-- 7. Get MainWalletBalance from BitcoinWallet  	//-- Succsess Code = 107, Error Code: 207 // Cant get user Balance
					//-- 8. Check if(MainAccountBalance > TransferAmount) Transfer  Amt = UserWinAmount	//-- Succsess Code: 108, Error Code: 208 // We have Big problems there is no money on wallet
					//-- 9. Make Transfer: MainWalletAccount -->  PlayerWallet  //-- Succsess Code = 109 //-- Error Code: 209
					//-- 10. Insert Bet Object Into Databse: 


					//-- 0 Get Client BTC Addres Via Session Store
					function(callback)
					{	

							_StartDate = Date.now();

							Models.users.findOne({ UserSession: SessionID }, function(err, doc){

									console.log('Session: ', SessionID , 'BTC: ', doc.BTCAdress);
									
									if(err){

											logger.log('0:  Session database Error: ', 200);
											logger.info('0:  Session database Error: ', 200);
											return callback(err, 200);
									}

									if(doc.BTCAdress == undefined){  

											logger.log('0:  Session Not Found: ', 200);
											logger.info('0:  Session Not Found: ', 200);
											return callback(err, 200);
									}

									logger.log('0:  Session Found: Btc Address is: ', doc.BTCAdress);									
									logger.info('0: Session Found: Btc Address is: ', doc.BTCAdress);									
									

									_PlayerBTCAdress = doc.BTCAdress;
									_PlayerWalletAccount = doc.BTCAccount;

									callback(null, 100); 

							});
					},


				 //-- 2. Get Player BTC Balance From Bticoin Wallet //-- Succsess Code = 102, Error Code: 202 // Cant get user Balance	
				 function(callback)
				 { 
				 			client.cmd('getbalance', _PlayerWalletAccount, 0 , function (err, balance) {

				            if (err) 	{ 
		              			logger.log('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			logger.info('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			return  callback(err, '202'); 
				            }

					            logger.info('2. Get Player Balance From Bticoin Wallet: Balance =', balance);
			 							  logger.log('2. Get Player Balance From Bticoin Wallet: Balance = ', 	balance);
			 							  

			 							  _StartBalance = balance;

						          callback(null, 102);
				       });
				 },


				 //-- 3. Check If(PlayerBalance >= BetAmount)  //-- Succsess Code = 103 (Balance is Ok), Error Code: 203 // Not Enough balance
				 function(callback)
				 {
						 		if(BetObj.amt > _StartBalance)
						 		{
               			logger.error('3. Compare PlayerBalance And BetAmount 203  %s  %d', 'Player Balance : ', _StartBalance);
						 				return callback(203,203);
						 		}

							 		logger.log('3. PlayerBalance And BetAmount OK)', 103);
							 		logger.info('3. PlayerBalance And BetAmount OK', 103);
							 		
							 		callback(null,103);
				 },


				 //-- 4. Make Transfer: PlayerWallet --> MainWallet, Transfer Amt: BetAmount //-- Succsess Code = 104, Error Code: 204 // Cant Transfer Money 
				 function(callback)
				 {
			  		 client.cmd('move', _PlayerWalletAccount, _MainWalletAccount, BetObj.amt, 0,  function (err, tid) {
                   
                   if (err) { 
                   			                   			
                   			logger.error('Transfer Error %s %s %d', util.inspect(err), 'Transfer Amount: ', BetObj.amt);                   		
                   			return callback(err, 204); 
                   } 
                   
                   logger.log('4. Make Transfer PlayerWallet -> MainWallet OK', 104)
                   logger.info('4. Make Transfer PlayerWallet -> MainWallet', 104)
                   

                   callback(null, 104);
						 });							  		 						
				 },

					

				 //-- 7. Get MainWalletBalance from BitcoinWallet  	//-- Succsess Code = 106, Error Code: 206 // Cant get user Balance
				 function(callback)
				 {	
				 			client.cmd('getbalance', _MainWalletAccount, 0, function (err, balance) {

				            if (err) 	{ 
				              			logger.log('6. Get MainWalletBalance from BitcoinWallet', err);  
				              			logger.info('6. Get MainWalletBalance from BitcoinWallet', err);  
				              			return  callback(err, 202); 
				            }

				            logger.info('6. Get MainWalletBalance from BitcoinWallet OK: Balance =', balance);
		 							  logger.log('6. Get MainWalletBalance from BitcoinWallet OK: Balance = ', 	balance);
										
										var _EndDate = Date.now();
                   	var datediff =  _EndDate - _StartDate;
									 	logger.info('Date Diff on 6 : ', datediff);

		 							  _MainWalletBalabce = balance;

					          callback(null, 106);
				       });
				 },


				//-- 8. Check if(MainAccountBalance > TransferAmount) Transfer  Amt = UserWinAmount	//-- Succsess Code: 107, Error Code: 207 
				function(callback)
				{
						if(_SlipAmount > _MainWalletBalabce) 
						{
									logger.log('7. Check if MainAccountBalance < TransferAmount', 207);  
				          logger.info('7. Check if MainAccountBalance < TransferAmount', 207);  
									return callback(207, 207);
									//-- We have Big problems there is no money on wallet...  Call to stop game API !!!
						}

						logger.log('7. Check if MainAccountBalance > TransferAmount', 107);  
				    logger.info('7. Check if MainAccountBalance > TransferAmount', 107);  
						

						callback(null, 107);
				},


				//-- 9. Make Transfer: MainWalletAccount -->  PlayerWallet //-- Succsess Code = 109 //-- Error Code: 209 
				function(callback)
				{

						if(_SlipWinAmount === 0)
						{
								logger.log('9. No Winning Go To DB Insert part %d', _SlipWinAmount);
								return callback(null, 109);
						}

						client.cmd('move', _MainWalletAccount, _PlayerWalletAccount, _SlipWinAmount, 0 , function (err, tid) {
                   
                   if (err) { 
												logger.error('Transfer From MainWalletAccount Error %s %s %d', util.inspect(err), 'Transfer Amount: ', _SlipWinAmount);                   		
                   			return callback(err, 209); 
                   } 
                   
                   logger.log('9. Make Transfer MainWallet -> PlayerWallet OK', 109);
                   logger.info('9. Make Transfer MainWallet -> PlayerWallet', 109);
                   
                   var _EndDate = Date.now();
                   var datediff =  _EndDate - _StartDate;
									 logger.info('Date Diff on 9 : ', datediff);

                   
                   _transactionId = tid;
                   callback(null, 109);
						 });							  		 
				},


				// Extra Get Fuuuck !!! too Dirty Code !!! Fuck ! 
				function(callback)
				{ 
				 			client.cmd('getbalance', _PlayerWalletAccount, 0 , function (err, balance) {

				            if (err){ 			

				            			console.log(err);
		  	            			return  callback(err, 202); 
				            }

				            _FinalBalance = balance;					         
					          callback(null, 102);
				       });

							//callback(null);
				 },


				//-- 10. Insert Bet Object Into Databse: 
				function(callback)
				{
						var slip = new  Models.betslip({

									GameID						: _GameID,
									ButtonId					: BetObj.id,
									SlipAmount				: BetObj.amt,
									StartBalance			: _StartBalance,
									EndBalance 				: _FinalBalance,
									SlipWinAmount 		: _SlipWinAmount,
									SessionID					: SessionID,
									Wallet 						: _PlayerBTCAdress,
									BtcTransactionId	: _transactionId,
									ErrorCode					: 0

						});	
					

						logger.info('Slip %s', util.inspect(slip));                   		

						slip.save(function(err, doc){		

									 logger.log('10.  Insert Bet Into Database OK: ', 110);
      			       logger.info('10. Insert Bet Into Database OK" ', 110);									 
									 
									 _EndDate = Date.now();

									 var datediff =  _EndDate - _StartDate;
									 logger.info('Date Diff on End: : ', datediff);

									 logger.info('==========================================================');                   		
									 callback(err, doc);
						});	

					//--  BitcoiD is too slow:  https://bitcointalk.org/index.php?topic=262167.0					

				}
		    
		],

		//--Final Callback
		function(err, results){	    

		    if(err) {  

		    		logger.log(err);
		    		console.log('results log: ', results);		    		
		    		console.log('Error Code is:', _.max(results));
		    		var doc = { "ErrorCode": _.max(results) };

		    		return callback(null, doc); // Max  Number is  an ErrorCode 
		  	} 

		  	console.log(results);

		    callback(null, results[8]);		    

		});

}; // Eof Place Bet !!!

