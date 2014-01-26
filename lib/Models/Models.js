// Users  & Session Model 
var mongoose 	= require('mongoose');


module.exports = function(mongoose) {
	
	//-- Create  users Session Schema 
	var usersSessionSchema  = mongoose.Schema({

				UserName 				: 		String,
				UserSession 		: 		String,
				BTCAdress				: 	  String,
				BTCAccount			:  		String,
				balance 				:  		Number	    

	});

	//-- Bets Slip Schema 
	var BetSlipsSchema  		= mongoose.Schema({		

				GameID 							: 		String,
				SlipCreateDate 			: 	  { type: Date, default: Date.now },
				ButtonId						: 		Number,
				SlipAmount      		:     Number,
				SlipWinAmount				:     Number,
				StartBalance				:     Number,
				EndBalance					: 		Number,
				SessionID						:     String,
				Wallet							:     String,
				BtcTransactionId		:     String,
				ErrorCode						: 		Number
	});



var TransactionModel = mongoose.Schema({

				Txn: 					String,
				Time: 				String,
				Timerecived: 	String,
				Acc:  				String,
				Address: 			String,
				Amount: 			Number,
				Operation: 		String, // Send recive 
				InfoDeliveryStatus: Number,
				RecieverAddress:  String
				// FromAcc: String,
				// FromAddress: String,
				// FromAmount: Number,
				// Fee: Number,
				// ToAcc: String,
				// ToAddress: String,
				// ToAmount: Number,
				// InfoDeliveryStatus: Number

});

//-- Create model 
// var SlipModel  = mongoose.model('betslips', BetSlipsSchema);


	var models = {
      	
      	users 			: 	mongoose.model('users', usersSessionSchema),
      	betslip     :   mongoose.model('betslip', BetSlipsSchema),
      	transactions :  mongoose.model('transactions', TransactionModel) 

  };

   return models;

}
