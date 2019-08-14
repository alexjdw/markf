const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
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
app.use(express.static(angular_folder))

app.get('/api/totalcorner', (req, res) => {
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

app.all('*', (req, res) => {
    res.status(200).sendFile(`/`, {root: angular_folder});
});

app.listen(port, () => {
    console.log("TotalCorner API server startup completed.")
    console.log("Listening on: http://localhost:" + port);
});
