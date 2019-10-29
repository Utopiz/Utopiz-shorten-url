'use strict';

var express = require('express');
var app = express();
var mongodb = require('mongodb');
const mongoose = require('mongoose');
var cors = require('cors');

// Basic Configuration 
var port = process.env.PORT || 3000;

//Node to find static content
app.use('/public', express.static(process.cwd() + '/public'));

/** connecting to the database**/ 
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded());
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//Create a urlDoc model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  originalUrl: String,
  shortUrl: String
});

var urlDoc = mongoose.model("urlDoc", urlSchema);


//Create database Entry
app.post('/api/shorturl/new', function(req, res) {
  var url = req.body.url;
  //url validation from https://www.w3resource.com
  var regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  if (regexp.test(url)){
    let shortUrl;
    urlDoc.findOne({originalUrl : url}, function(err, data){
      //check whether the url is existed in the database or not
      if(data === null || err) {
        //Generate a random number between 0 to 1000 for url;
        shortUrl = Math.floor(Math.random() * 1000).toString();
        //Create and save original and shortened url pairs
        var urlMap = new urlDoc({
          originalUrl: url,
          shortUrl: shortUrl  
        });
        urlMap.save(function(err) {
          if(err) {
            return console.error(err);
          }
        });
        return res.json({"original_url" : url, "short_url" : shortUrl}); 
      } else {
        //Found in database
        shortUrl = data.shortUrl;
        return res.json({"original_url" : url, "short_url" : shortUrl}); 
      } 
    });
  } else {
    return res.json({"error" : "Invalid URL"});
  }
});

//Query database and forward to original URL
app.get('/api/shorturl/:shortUrl', function(req, res) {
  var shortUrl = req.params.shortUrl;
  urlDoc.findOne({shortUrl : shortUrl}, function(err, data) {
    if(err) {
      return res.send('Error reading database');
    }
    res.redirect(data.originalUrl);
  });
});

// Listen to see is everything is working
app.listen(port, ()=> {
  console.log('Node.js listening ... Everything is Working');
});