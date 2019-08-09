const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
const mongoose = require('mongoose');
const models = require('./server/models.js');
const scrape = require('./server/scraper.js').scrape

// Server
const port = 5555;

// Angular
const angular_folder = __dirname + '/my-app/dist/my-app';

var last_scrape_time = new Date(0);

console.log('Initializing server properties...');

var app = express();
app.use(bodyParser.json())
app.set('json spaces', 2);

app.use(express.static(angular_folder))

app.get('/api/totalcorner', (req, res) => {
    if (last_scrape_time + 1800 < new Date().getTime()) { // every 30 minutes or whenever server reboots.
        last_scrape_time = new Date().getTime();
        scrape();
    }
    res.status(200);
    res.json(mongo_data);
});

app.all('*', (req, res) => {
    res.status(200).sendFile(`/`, {root: angular_folder});
});

app.listen(port, () => {
    console.log("TotalCorner API server startup completed.")
    console.log("Listening on: http://localhost:" + port);
});

scrape()