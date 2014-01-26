// Users.js - User Model

module.exports = function(mongoose) {
	
	//-- Create  users Session Schema 
	var usersSessionSchema  = mongoose.Schema({

				UserName 				: String,
				UserSession 		: String,
				BTCAdress 			: String,
				BTCAccount 			: String , 
				balance 				: Number	    

	});


	var models = {      
      	users 			: 	mongoose.model('users', usersSessionSchema)      	
  };

   return models;

} 
