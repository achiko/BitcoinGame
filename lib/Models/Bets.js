// Bets Model
var mongoose 	= require('mongoose');


module.exports = function(mongoose) {
	

	//-- Bets Slip Schema 
	var BetSlipsSchema  = mongoose.Schema({		

				GameID 							: 		String,
				SlipCreateDate 			: 	  { type: Date, default: Date.now },
				ButtonId						: 		Number,
				SlipAmount      		:     Number,
				SlipWinAmount				:     Number,
				UserBalance					:     Number,
				SessionID						:     String,
				Wallet							:     String,
				BtcTransactionId		:     String
	});



	var models = {      
      	betslip     :   mongoose.model('betslip', BetSlipsSchema)

  };

   return models;

}
