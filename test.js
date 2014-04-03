var async 			= require('async');
var mongoose 	  = require('mongoose');
var _           = require('underscore');
var bitcoin 		= require('bitcoin');
var winston 		= require('winston');

mongoose.connect('mongodb://localhost/satoshi');
var db = mongoose.connection;

var client = new bitcoin.Client({
    host: 'localhost',
    //port: 8332,
    port: 18332,
    user: 'bitcoinrpc',
    pass: '3VXSDdC69sQnd9c6xur1Nx77S7gyFwcc3ZFmJDfyt6cM'
});

var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'log.log' })
    ]
  });


var Models   = require('./lib/Models/Models.js')(mongoose);



//-- Place Bet 
PlaceBet = function(db, SessionID, currentcoefs, BetObj, BetData, callback) {


			var _GameID;					
			var _SlipAmount;
			var _SlipWinAmount;
			var _UserBalance;
			var _SessionID;
			var _Wallet;

			var _BetCoef = currentcoefs[BetObj.id];

			_GameID 					=  BetData.gameID;
			_SlipAmount 			= BetObj.amt;
			_SlipWinAmount 		= _BetCoef * BetObj.amt; 
			_UserBalance 			= 0;
			_SessionID 				= SessionID;


		async.waterfall([	    

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


					function(callback)
					{							
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
									logger.info('0:  Session Found: Btc Address is: ', doc.BTCAdress);									

									_Wallet = doc.BTCAdress;

									callback(null, doc.BTCAdress); 

							});
					},


					//-- 1. Get Player Account From Bticoin Wallet Succsess Code = 101, Error Code: 201 // Cant Accses Wallet			
					function(playerAdress, callback)
					{
							client.cmd('getaccount', playerAdress, function (err, acc) {
	           				
			          		if (err)  { 		         					
			        						logger.log('1. Error Get Player Account From Bticoin Wallet', err); 
													logger.info('1. Error Get Player Account From Bticoin Wallet', err); 

			        						return callback(err, '201');  
		          			}						

			          		logger.info('1. Get Player Account From Bticoin Wallet: ', acc);
			          		logger.log('1. Get Player Account From Bticoin Wallet: ',  acc);
			          		
			          		callback(null, acc);

							});
				 },

				 //-- 2. Get Player Balance From Bticoin Wallet //-- Succsess Code = 102, Error Code: 202 // Cant get user Balance	
				 function(playerBtcAccount,callback)
				 {				 		
				 			client.cmd('getbalance', playerBtcAccount,0, function (err, balance) {

				            if (err) 	{ 
		              			logger.log('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			logger.info('2. Error Get Player Balance From Bticoin Wallet', err);  
		              			return  callback(err, '202'); 
				            }

				            logger.info('2. Get Player Balance From Bticoin Wallet: Balance =', balance);
		 							  logger.log('2. Get Player Balance From Bticoin Wallet: Balance = ', 	balance);

		 							  _UserBalance = balance;

					          callback(null, balance, playerBtcAccount);
				       });
				  },


				 //-- 3. Check If(PlayerBalance >= BetAmount)  //-- Succsess Code = 103 (Balance is Ok), Error Code: 203 // Not Enough balance
				 function(playerbalance, playerBtcAccount, callback)
				 {
					 		if(BetObj.amt > playerbalance)
					 		{
					 				logger.log('3. Compare PlayerBalance And BetAmount)', 203);
					 				logger.info('3. Compare PlayerBalance And BetAmount', 203);
					 				return callback(203, 203);
					 		}

						 		logger.log('3. PlayerBalance And BetAmount OK)', 103);
						 		logger.info('3. PlayerBalance And BetAmount OK', 103);
						 		
						 		callback(null, playerBtcAccount);
				 },


				 //-- 4. Make Transfer: PlayerWallet --> MainWallet, Transfer Amt: BetAmount //-- Succsess Code = 104, Error Code: 204 // Cant Transfer Money 
				 function(playerBtcAccount, callback)
				 {

			  		 client.cmd('sendfrom', playerBtcAccount, mainBtcAdress, BetObj.amt, 0,  function (err, tid) {
                   
                   if (err) { 
                   			logger.log('4. Make Transfer PlayerWallet -> MainWallet', 204)
                   			logger.info('4. Make Transfer PlayerWallet -> MainWallet', 204)
                   			return callback(err, 204); 
                   } 
                   
                   logger.log('4. Make Transfer PlayerWallet -> MainWallet OK', 104)
                   logger.info('4. Make Transfer PlayerWallet -> MainWallet', 104)
                   callback(null);
						 });							  		 
						
				 },

					
				 // Calculate User Win ??

				 //-- 6. Get MainWalletAcount From BitcoinWallet  //-- Succsess Code = 105, Error Code: 205 // Cant Accses Wallet
				 function(callback)
				 {

				 		client.cmd('getaccount', mainBtcAdress, function (err, acc) {
	           				
			          		if (err)  { 		         					
			        						logger.log('5. Error Get Player Account From Bticoin Wallet.....', err); 
													logger.info('5. Error Get Player Account From Bticoin Wallet.....', err); 

			        						return callback(err);  
		          			}						

			          		logger.info('5. Get Player Account From Bticoin Wallet: ', acc);
			          		logger.log('5. Get Player Account From Bticoin Wallet: ',  acc);
			          		
			          		callback(null, acc);
							});
				  },


				 //-- 7. Get MainWalletBalance from BitcoinWallet  	//-- Succsess Code = 106, Error Code: 206 // Cant get user Balance
				 function(mainBTCAccount, callback)
				 {				 		
				 			client.cmd('getbalance', mainBTCAccount, function (err, balance) {

				            if (err) 	{ 
				              			logger.log('6. Get MainWalletBalance from BitcoinWallet', err);  
				              			logger.info('6. Get MainWalletBalance from BitcoinWallet', err);  
				              			return  callback(err, '202'); 
				            }

				            logger.info('6. Get MainWalletBalance from BitcoinWallet OK: Balance =', balance);
		 							  logger.log('6. Get MainWalletBalance from BitcoinWallet OK: Balance = ', 	balance);

					          callback(null, mainBTCAccount, balance);
				       });
				  },


				//-- 8. Check if(MainAccountBalance > TransferAmount) Transfer  Amt = UserWinAmount	//-- Succsess Code: 107, Error Code: 207 
				function(mainBTCAccount, mainBalance, callback)
				{
						if(_SlipAmount > mainBalance) 
						{
									logger.log('7. Check if MainAccountBalance > TransferAmount', 207);  
				          logger.info('7. Check if MainAccountBalance > TransferAmount', 207);  
									return callback(207);									
									//-- We have Big problems there is no money on wallet...  Call to stop game API !!!
						}

						logger.log('7. Check if MainAccountBalance > TransferAmount', 107);  
				    logger.info('7. Check if MainAccountBalance > TransferAmount', 107);  
						callback(null, mainBTCAccount);
				},


				//-- 9. Make Transfer: MainWalletAccount -->  PlayerWallet //-- Succsess Code = 109 //-- Error Code: 209 
				function(mainBTCAccount, callback)
				{

						client.cmd('sendfrom', mainBTCAccount, playerAdress, _SlipWinAmount, function (err, tid) {
                   
                   if (err) { 
                   			logger.log('9. Error: Make Transfer: MainWalletAccount  -->  PlayerWallet ', 209);
                   			logger.info('9. Error: Make Transfer: MainWalletAccount -->  PlayerWallet', 209);
                   			return callback(err, 204); 
                   } 
                   
                   logger.log('9. Make Transfer MainWallet -> PlayerWallet OK', 109);
                   logger.info('9. Make Transfer MainWallet -> PlayerWallet', 109);

                   callback(null, tid);
						 });							  		 
				},



				//-- 10. Insert Bet Object Into Databse: 
				function(tid, callback)
				{
						var slip = new  Models.betslip({

									GameID						: _GameID,
									ButtonId					: BetObj.id,
									SlipAmount				: BetObj.amt,
									UserBalance				: _UserBalance,
									SlipWinAmount 		: _SlipWinAmount,
									SessionID					: _SessionID,
									Wallet 						: _Wallet,
									BtcTransactionId	: tid

						});	

						//console.log(slip);


						slip.save(function(err, doc){
									
									//console.log(doc);
									callback(null, doc);
						});											

				}
		    
		],

		//--Optional Callback
		function(err, results){	    

		    console.log('Finish !!!!');

		    if(err) {  		    	
		    		console.log('Error Ocured !!!', err);
		    		logger.log(err);
		  	} 

		  	console.log('result is: ', results);
		      
		});

};


//--
var currentcoefs = '1.2,0,2,1.3,1.5,1.2,1.1,0,1.2,0,1.4,2.5,1.4,0,1.8,3,1.3,0,1.5,0,0,2.5,2.5,2,0,1.8,0,2,1.2,0,1.5,1.3,0,1.3,0,0,0,1.5,0,0,0,1.1,0,0,2,0,0,0,1.5,0,2.5,0,2.5,0,1.5,1.4,1.3,5,1.4,1.4,0,2,0,1.3,0,0,0,1.4,0,1.2,0,0,0,0,0,0,0,1.2,2.5,10,1.5,1.4,0,2,0,0,0,0,0,1.5,1.8,2,0,3,1.1,0,0,2,1.4,1.1,0,3,0,1.5,0,1.2,0,1.3,1.5,0,0,0,1.5,0,0,0,0,0,0,1.1,1.6,0,0,0,2,0,0,1.3,0,2.5,0,0,1.2,2.5,0,3,1.5,0,1.5,1.4,0,0,0,0,2,0,0,0,0,2.5,0,2,0,2.5,2.5,1.8,0,3,1.3,0,0,1.3,0,1.3,0,1.5,1.3,0,3,1.2,0,1.3,2,0,1.3,0,1.3,0,0,0,1.6,0,1.4,3,1.4,2,0,2,1.1,1.3,1.5,5,0,0,0,1.4,2.5,0,0,2.5,0,0,5,0,2.5,0,1.4,2,1.3,1.2,0,0,0,0,1.5,1.3,2,1.5,2.5,1.3,0,0,1.3,0,2.5,1.5,0,1.2,2.5,2.5,0,0,0,0,0,0,1.3,0,1.3,1.3,1.3,1.4,1.5,2,1.2,0,0,3,1.3,0,2,1.5,1.5,1.4,3,0,0,0,1.5,0,0,0,2,0,2,1.4,1.3,0,1.4,0,1.8,2,1.6,0,1.5,1.1,1.3,2,0,0,0,2.5,0,0,0,0,0,1.2,1.5,2.5,1.3,0,2.5,1.3,0,1.3,1.6,1.4,0,3,0,1.4,0,1.3,0,2,1.2,0,1.6,3,2,1.4,1.6,0,0,1.5,1.3,1.5,0,1.3,0,1.4,2,3,0,5,2,0,1.6,0,1.1,0,2.5,2,0,0,1.3,1.8,0,0,0,0,0,0,0,0,1.2,0,0,0,1.1,0,0,0,0,1.1,1.5,1.5,2,1.1,1.1,1.5,0,1.2,1.8,0,0,0,1.2,0,1.2,0,0,0,0,0,0,1.8,5,1.3,1.8,1.8,1.2,1.3,0,1.4,0,1.5,1.4,1.5,1.6,0,0,0,1.8,0,0,0,0,1.3,1.3,0,0,2,5,1.3,0,0,1.2,1.4,1.3,0,2,1.3,1.3,0,0,2.5,1.2,1.3,1.8,0,1.5,0,1.5,0,0,1.6,0,2,0,0,1.4,0,1.5,1.2,0,3,0,2.5,2.5,0,1.4,1.6,0,0,1.3,0,0,1.4,0,0,2,0,2,0,0,2,0,0,0,10,0,0,0,0,0,1.5,0,1.3,0,1.2,1.3,1.2,1.6,5,1.2,0,1.2,0,0,0,0,3,0,1.5,0,0,0,1.4,0,0,1.4,0,0,1.5,2.5,1.3,0,0,1.2,1.8,0,0,0,1.5,1.5,0,0,0,1.2,0,1.3,0,1.4,0,0,0,2,2,0,3,1.4,0,0,0,0,1.5,1.4,0,0,0,0,2,0,0,3,1.4,1.3,2.5,1.6,0,1.3,0,1.6,0,0,5,0,0,1.1,2,1.4,0,1.4,0,0,5,0,0,0,2.5,0,0,1.2,5,2.5,0,1.3,2.5,1.8,2,2,1.3,2.5,1.5,0,5,0,0,0,1.1,2.5,1.5,0,10,0,0,0,0,0,0,0,2.5,2,2,1.3,0,5,0,0,1.5,5,0,0,5,1.1,2.5,0,3,0,5,1.6,0,0,0,0,0,0,0,0,1.6,2,1.5,3,0,2.5,1.1,0,1.3,1.3,0,0,10,5,0,0,3,0,0,0,0,0,0,0,1.3,1.5,2,0,0,1.5,1.6,0,0,0,0,0,1.5,0,1.2,0,0,0,1.5,1.6,0,0,0,0,2,1.5,0,10,0,1.3,5,1.3,5,0,0,2,2.5,0,0,0,0,0,0,1.3,0,0,5,0,3,0,0,3,0,1.3,0,0,5,0,2.5,0,0,1.4,1.5,0,5,0,0,1.3,1.3,1.8,1.2,0,1.3,0,2.5,1.3,2,1.3,0,0,0,0,5,0,0,1.6,0,0,1.2,0,0,1.5,1.1,0,1.3,2,2.5,5,2,2,0,5,2,5,2,2.5,3,1.1,1.5,3,0,2,0,0,1.4,1.3,0,0,0,0,0,0,0,1.5,0,0,0,1.3,1.4,1.4,1.4,1.2,0,2,0,0,0,1.2,2,2,0,1.2,3,0,1.3,0,1.5,0,0,0,1.5,1.5,2,5,1.3,0,0,1.4,1.5,1.4,0,1.3,2.5,3,1.3,2,0,1.1,0,1.4,0,0,0,0,0,0,0,0,0,1.4,2,1.2,2,1.6,1.2,0,0,1.5,1.2,1.3,1.3,0,0,0,0,0,5,1.2,0,0,1.2,1.6,0,0,0,3,0,1.4,2,2,1.2,0,1.3,1.8,1.6,0,0,1.1,1.5,1.4,1.1,0,1.2,0,0,2,0,1.5,0,1.6,1.3,1.4,0,0,0,0,0,5,5,1.4,0,0,0,1.6,0,1.5,0,1.3,0,1.4,0,1.2,1.3,0,0,1.4,1.2,0,1.8,0,2,0,2,0,2,2.5,0,0,0,2.5,0,0,2.5,1.2,1.2,1.5,0,1.2,1.4,0,0,0,2.5,0,0,0,2.5,0,1.2,1.4,2,1.5,0,0,1.2,0,0,0,0,0,0,1.1,1.3,0,0,2.5,2.5,0,0,1.4,0,1.8,1.2,0,1.4,1.5,1.4,0,0,0,1.4,0,0,0,0,0,0,0,0,1.4,0,0,1.6,1.6,1.5,2,1.5,1.2,0,0,0,0,2.5,0,2,2,0,0,2.5,0,0,1.3,0,1.4,0';
var BetObj 		= { "id": 10, "amt": 0.0001  };
var BetData 	= { "gameID": 1, "desk": '0,0' };


var SessionID 	= "98bb2810-674a-11e3-8dc8-57290375f15e";
var mainBtcAdress = "n3rzaZAUuVZMgJPNX1BZZEQaqzVhW87pWm";
var playerAdress 	= "mzzkQKgpEgwHPWV5uVwb3rbcTeE5QhDhzb";

PlaceBet(db, SessionID, currentcoefs, BetObj, BetData,  function(err, resp){

		if(err) {
						console.log('Error Ocured: ', err);
		}else{
						console.log('Function responce: ', resp);
		}
		

});