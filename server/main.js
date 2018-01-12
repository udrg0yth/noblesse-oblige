var express    			=  require('express'),
	bodyParser 			=  require('body-parser'),
	application         =  express(),
	genericConstants    =  require('./generic-constants')(),
	cors                =  require('./cors-filter')(application, genericConstants),
	http				=  require('http'),
	tokenHandler		=  require('./interceptor')(application, genericConstants),
	mongodb = require('mongodb'),
    mongoClient = mongodb.MongoClient;

// parse application/x-www-form-urlencoded 
application.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json 
application.use(bodyParser.json())
 

mongoClient.connect('mongodb://localhost:27017/noblesse_oblige', function (err, database) {
	if(err) {
		console.log('Error connecting to database localhost:27017/noblesse_oblige', err)
	} else {
 		require('./server')(database.db('noblesse_oblige'), application, genericConstants, tokenHandler);
 	}
});

http.createServer(application).listen(8080, function(){
  console.log("Express server listening on port " + 8080);
});