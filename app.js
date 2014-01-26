//-- App.js
var util        = require('util');
var _           = require('underscore');
var fs          = require('fs');
var uuid        = require('node-uuid');
var mongoose    = require('mongoose');
var bitcoin     = require('bitcoin');

//-- Modules 
var express     = require('express')
  , MongoStore  = require('connect-mongo')(express)
  , ioSession   = require('socket.io-session');


var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


//io.set('log level', 1); // reduce logging


//-- My requirements 
var ses   = require('./lib/Users/sessionmanager');
var bets  = require('./lib/GameCore/odds');
var slips = require('./lib/Bets/placebet.js');
var trans = require('./lib/Payments/transactionfinder.js');
var withdraw = require('./lib/Payments/withdraw.js');



//-- generate Bitocin Adress
var client = new bitcoin.Client({

          host: 'localhost',
          //port: 8332,
          port: 18332,
          user: 'testuser',
          pass: 'testpasss'
 });



// We define the key of the cookie containing the Express SID
var EXPRESS_SID_KEY = 'user.sid';

// We define a secret string used to crypt the cookies sent by Express
var COOKIE_SECRET = 'testsecret';

var sessionKey = '5565465458854645989788829292929';
var memoryStore = new MongoStore({ db: 'sessions', url: 'mongodb://localhost/sessions' });


app.configure(function() {
    app.use(express.static(__dirname + '/web'));
    app.use(express.cookieParser(COOKIE_SECRET));
    app.use(express.session( { secret: sessionKey, store: memoryStore } ));
    app.use(express.bodyParser());
    //app.use(express.logger());
    app.use(app.router);
});



//-- Mongo DB 
mongoose.connect('mongodb://localhost/satoshi');
var db = mongoose.connection;

//-- DB Models
var Models = require('./lib/Models/Models.js')(mongoose); 



///// Bets data /////

var currentcoefs = {};
var betData = {};


// Create New game On start !
StartnewGame = function(calback)
{
      bets.CreateNewGame(db,  function(err, result){

            console.log('Create New Game Sucsess');          
            currentcoefs = result.bets;
            betData = { "gameID": result.gameId, "desk": result.desk };

            calback(null,'ok');
      });
}


StartnewGame(function(err, result){
    //console.log('Game Created !!! ............................. ');
});

// Eof Create new Game !!! 


// Router
app.get('/', function(req, res)
   {  
          if(req.session.uid === undefined)
          {
                 console.log('Create Session !!!');
                 var guid         =   uuid.v1();
                 req.session.uid  =   guid; 

                 ses.userssession(db, Models, client, 'anonim', guid, function(erro, addr) {
                      //-- var log = fs.createWriteStream('session.txt', {'flags': 'a'}); 
                      //-- log.end(util.inspect(that.req.session, false, null) + "\n");
                 });
          }
        
        res.sendfile("web/main.html");  
   });


 app.get('/api/bets', function(req, res)
 {
      res.send(betData); 

      // test message only !1!
      // connections[req.session.uid].emit('testmessage ', 'Hiiii  Hidden user !!!!');       
      // io.sockets.emit('testmessage', 'Hi New User connected to system !!!');
    
 });


 app.get('/getbets', function(req, res){

      bets.getcurrentOddsList(db, function(err, doc){
            if(err) {  res.send(err) }          
      });

      res.send('Ok !!!');
 });

app.get('/newgame', function(req, res){

        //console.log('Call create new Game Function'); 
        bets.CreateNewGame(db,  function(err, result){
            
            currentcoefs = result.bets;
            betsData = { "gameID": result.gameId, "desk": result.desk  };
            res.send(betsData);
        });

          //-- var log = fs.createWriteStream('session.txt', {'flags': 'a'}); 
          //-- log.end(util.inspect(connections, false, null) + "\n");
  });



  //-- Witdraw Bitcoins
  app.post('/withdraw', function(req, res){

          console.log(req.body.btcaddress);
          console.log(req.session.uid);
          var btcaddress = req.body.btcaddress;

          console.log('Posted BTC ADDRESSS: ', btcaddress);

          withdraw.WithdrawBtc(db, Models, client, req.session.uid, btcaddress , function(err, response){

              console.log('Withdraw response: ', response);

          });

          res.send('oook !!!'); 

  });


 //-- Transaction Notifier !!!
 app.get('/sess/:txn', function(req, res) {
                
          var txn = req.params.txn; 
          
          trans.GetTransaction(db,Models,client,txn, function(err, response) {

                  console.log('...........................................');
                  console.log('Transaction response: ', response);
                  console.log('...........................................');
              
                  if(undefined !== response)
                  {

                    if(response.DeliveryStatus  === 0)
                    {

                        var obj = _.findWhere(connections, { session: response.UserSession });
                        console.log('Soocket Object:', obj);

                        if(undefined !== obj )
                        {
                                io.sockets.socket(obj.socketid).emit('transnotify', response);

                                //-- Update DB:  Set Delivery Status 1
                                var query = { Txn: response.txn };
                                Models.transactions.findOneAndUpdate(query, { InfoDeliveryStatus: 1 }, function(err, res){
                                      console.log('Doc Status has been upated !!!');
                                });                          
                        }

                    }
                }

          });

          res.send('Ok');

  });


//-- Socket !
io.set('authorization', ioSession(express.cookieParser(sessionKey), memoryStore));
var connections = [];  

// Good article about  Expressjs and Socket.io Push notifications 
// http://blog.joshsoftware.com/2012/01/30/push-notifications-using-express-js-and-socket-io/

io.sockets.on('connection', function (socket) {

           //-- Socket IO Perfrmance : http://stackoverflow.com/questions/10161796/how-many-users-nodejs-socket-io-can-support
           // Add SID in connections object // Need For sending from Express JS 

           connections.push({ "session": socket.handshake.session.uid, "socketid": socket.id  });
                  

           //-- send bet data to client !
           socket.emit('firstload', betData );
                     
           //-- Send User Address and  balance 
           ses.getUserBySession(db, Models, client, socket.handshake.session.uid, function(err, doc){             
               //console.log('User Data  For getbtc: ', doc);
               socket.emit('getbtc', doc);
           });

           //-- 
           socket.on('disconnect', function() {   

                console.log('Client disconected !!! ', socket.handshake.session.uid );
                connections = _.without( connections, _.findWhere(connections, {session: socket.handshake.session.uid }) );
           });


          // Withdraw Request !!!
          socket.on('withdraw', function(data){

              withdraw.WithdrawBtc(db, Models, client, socket.handshake.session.uid, data.btcaddress , function(err, response){
                  
                  console.log('Withdraw response: ', response);
                  io.sockets.socket(socket.id).emit('withdrawresponse', response);

              });
              
          });

          //-- Make Bet Function
          socket.on('makebet', function (data) {
              
                var clientSession = socket.handshake.session.uid;

                //-- 1. Check if  bet already taken !!!  Fuck !!!
                if(betData.desk[data.id] !== null)
                {
                    betresponce = { ErrorCode:  1000 }; // bet Already taken !
                    io.sockets.socket(socket.id).emit('betresponse', betresponce);
                    return;
                }


                ////// betData.desk[data.id] = currentcoefs[data.id]; ////  Double bet Problem !!! 
                
                //-- Place Bet                             
                slips.PlaceBet(db, Models, client, clientSession, currentcoefs, data, betData, function(err, result){                    

                          var shadowdata  = betData.desk;                
                          var odds        = _.reject(shadowdata, function(num){ return num  == null; });                              

                          if(odds.length === 700)
                          {
                                  //console.log('We need to start new game !!!');                                                                    
                                  StartnewGame(function(err){
                                      io.sockets.emit('firstload', betData);  
                                  });                              
                          }


                          var betresponce = {};

                          if(result.ErrorCode !== 0)
                          {
                                //console.log('result Errorcode: ', result.ErrorCode);
                                betresponce = { ErrorCode:  result.ErrorCode };
                                io.sockets.socket(socket.id).emit('betresponse', betresponce);

                          }else{

                                // Find position in array
                                var coef    = currentcoefs[data.id];                               
                                betData.desk[data.id] = coef; //-- Put open button coef on emty desk --//
                              

                              //-- Generate bet responce Message For Client 
                              var betresponce = { 

                                    ErrorCode       :   result.ErrorCode,
                                    betAmount       :   result.SlipAmount,
                                    winAmount       :   result.SlipWinAmount,
                                    curentbalance   :   result.EndBalance
                              };

                              io.sockets.socket(socket.id).emit('betresponse', betresponce);
                              
                              //-- Generate message For All Clients !
                              
                              var buttonsremained = 700 - odds.length;
                              var betAllMessage =  {

                                     betidtemid   : data.id,
                                     betcoef      : coef,
                                     buttremained : buttonsremained 

                                  };

                              io.sockets.emit('betallmessage', betAllMessage );
                          }
                          
                });
               

          });

});




server.listen(80);
