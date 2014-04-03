// Mai APP file !!! 
var util = require('util');
var _ = require('underscore');
var fs     = require('fs');
var uuid = require('node-uuid');
var mongoose   = require('mongoose');


var express     = require('express')
  , MongoStore  = require('connect-mongo')(express)
  , ioSession   = require('socket.io-session');


var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


// My requirements 
var ses = require('./Users/sessionmanager');


// We define the key of the cookie containing the Express SID
var EXPRESS_SID_KEY = 'user.sid';

// We define a secret string used to crypt the cookies sent by Express
var COOKIE_SECRET = 'mysecretjaja';

var sessionKey = '5565465458854645';
var memoryStore = new MongoStore({ db: 'sessions', url: 'mongodb://localhost/sessions' });


app.configure(function() {
    app.use(express.static(__dirname + '/web'));
    app.use(express.cookieParser(COOKIE_SECRET));
    app.use(express.session({ secret: sessionKey, store: memoryStore }));
});


// Mongooose DB Part

mongoose.connect('mongodb://localhost/satoshi');
var db = mongoose.connection;



 app.get('/', function(req, res)
 {  
        console.log(req.session.uid);

        if(req.session.uid === undefined)
        {
             console.log('Create Session !!!');
             req.session.uid =  uuid.v1();
             ses.userssession(db, 'anonim', req.session.uid);
        }

        res.sendfile("web/test.html");          
 });



app.get('/sess', function(req, res)
 {
        console.log('Curent Session Message is:',  req.session.uid);
        res.sendfile("web/test.html");          
 });



io.set('authorization', ioSession(express.cookieParser(sessionKey), memoryStore));

io.sockets.on('connection', function (socket) {

         socket.emit('firstload', socket.handshake.session.uid);

         // console.log('=====================================================');         
         // console.log( util.inspect(socket.handshake.session.uid , false, null) );         
         // var log = fs.createWriteStream('session.txt', {'flags': 'a'}); 
         // log.end(util.inspect(socket.handshake, false, null) + "\n");
         //console.log('=====================================================');


         socket.on('disconnect', function() {

               console.log('Disconecting ====================================================');         
               //console.log( util.inspect(socket.handshake.session.uid , false, null) );
               
               var log = fs.createWriteStream('session.txt', {'flags': 'a'}); 
               var message = "Dsiconnect Event ==========================================" + "\n";
               message  += util.inspect(socket.handshake.session.uid, false, null);
               message += "Eof Dsiconnect Event ==========================================" + "\n";

               log.end(message + "\n");
               console.log('=====================================================');

      });


});





server.listen(5000);
