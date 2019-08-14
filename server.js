const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const models = require('./server/models.js');
const scrape = require('./server/scraper.js').scrape;

mongoose.connect('mongodb://localhost:27017/soccer', {connectTimeoutMS: 1000})

// Server
var app = express();
const port = 5555;

// Angular
const angular_folder = __dirname + '/my-app/dist/my-app';

// Keep track of last time we scraped.
var last_scrape_time = new Date(0).getTime();

console.log('Initializing server properties...');

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/', (req, res) => {
    if (last_scrape_time + 120 * 60 < new Date().getTime()) { // every 2 minutes or whenever server reboots.
        last_scrape_time = new Date().getTime();
        scrape();
    }

    // Launch all the queries!
    var promise = new Promise(
        (resolve, reject) => {
            data = {}
            models.Match.find({})
                .then(
                    result => {
                        data.matches = result;
                        if (Object.keys(data).length == 3) {
                                resolve(data)
                            }
                        })
                .catch(err => reject(err));
            models.League.find({})
                .then(
                    result => {
                        data.leagues = result;
                        if (Object.keys(data).length == 3) {
                                resolve(data)
                            }
                        })
                .catch(err => reject(err));
            models.Team.find({}).then(
                    result => {
                        data.teams = result;
                        if (Object.keys(data).length == 3) {
                                resolve(data)
                            }
                        })
                    .catch(err => reject(err))
            });

        promise.then(
            // All mongooses have returned with some data
            // Respond with json
            data => {
                res.json(data);
                res.status(200);
            });

        promise.catch(
            err => console.log(err)
        )
});

app.listen(port, () => {
    console.log("TotalCorner API server startup completed.")
    console.log("Listening on: http://localhost:" + port);
});
