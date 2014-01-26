	// Game/ Bets Core
	var mongoose		= require('mongoose');
	var async				= require('async');
	var _						= require('underscore');
	var fs					= require('fs');
	//var sync				= require=('async')

		//-- Create  Schema 
		var BetsSchema  = mongoose.Schema({		
					Bets 							: 		String,
					OddsStartDate 		: 	  { type: Date, 		default: Date.now },
					isActive      		:     { type: Boolean, 	default: 1 } 
		});


		//-- Create model 
		var BetsModel  = mongoose.model('games', BetsSchema);

		// var desk = [];
		// for(var a = 0; a< 1001; a++ )
		// {
		// 		desk.push(null);	
		// }


	exports.CreateNewGame = function(db, callback){

		async.series([	    

		    //-- Foind  Active game and Update   
		    function(callback){	       	
		       	BetsModel.findOne({ isActive: 1 }, function (err, doc) {	  					
		  					if (err) {  
		  						console.log(err); 
		  						return callback(err); 
		  					}		  				
			  				if(doc === null) { 		  						
			  						//-- return callback(  new Error('No Game Found !!!')  );	
			  						callback(null, 'Step 1 : Game Not Found But we will create it ! ')
			  				}else{
			  					doc.isActive = 0;
		  						doc.save(function(err){
		  								callback(null, 'Step 1: Game has been found , Let Update ');
		  						});		
			  				}
						});							  		
		    },


	    // Generate New odds and insert !!!
	    function(callback){

	    		var coefs = [];
	    		var oddsmatrix = [

                  { odd: 1.1, count: 22 },
                  { odd: 1.2, count: 51 },
                  { odd: 1.3, count: 80 },
                  { odd: 1.4, count: 58 },
                  { odd: 1.5, count: 66 },
                  { odd: 1.6, count: 25 },
                  { odd: 1.8, count: 18 },
                  { odd: 2.0, count: 70 },
                  { odd: 2.5, count: 50 },
                  { odd: 3.0, count: 26 },
                  { odd: 5.0, count: 29 },
                  { odd: 10.0, count: 5 }
            ];

      
	       _.map(oddsmatrix, function(obj, key){ 
	                
	               for(var a=0; a < obj.count;  a++)
	               {
	                  coefs.push(obj.odd);
	               }
	        });

	        for(var i = 0; i< 500; i++ )
	        {
	            coefs.push(0);
	        }


					var newOdds = _.shuffle(coefs);

					// Generate EmptyDesk
					var emptyDesk = [];
					for(var a = 0; a< 1000; a++ )
					{
					    emptyDesk.push(null);  
					}

					// Create BetObject For Client and server
					var betObject = {};

	    			var bets = new BetsModel({
									Bets: newOdds,
									startdate: null,
									isActive: 1
						});

						//-- Save bets
						bets.save(function(err){								
									if(err) {  return callback(err) }
									betObject = { "gameId": bets._id, "desk": emptyDesk, "bets" : newOdds };
									
									callback(null, betObject);								
						});   	
	    }

	],

		//-- optional callback ?? What is oprional Callback ??? 
		function(err, results){	    
		    console.log('Final Stage !!!');

		    if(err) {  
		    		console.log('Error Ocured !!!', err);
		    		return callback(err);
		  	} 
		    
		    callback(null, results[1]);		    

		});

};



	//-- retrive odds from database
	exports.getcurrentOddsList = function(db, callback)
	{

			async.series([	    
	  	
	  	    function(callback){	    

								BetsModel.findOne({ isActive: 1 }, function (err, doc) {				  			
										if(err)	{ return callback(err); 	}									
										callback(null, doc);																				
								});
						}
			],

		function(err, results){
						
						console.log('reeesullt arrived !!!!');
						// if(err) {  return callback(err); }
						callback(null, results);
		});

};

