mongoose = require('mongoose');
request = require('request');

// TotalCorner api
const tc_root = 'https://api.totalcorner.com/v1'
const token = 'b2140c7c5378155e';
const matchcolumns = 'events,odds,asian,cornerLine,cornerLineHalf,goalLine,goalLineHalf,asianCorner,attacks,dangerousAttacks,shotOn,shotOff,possession';
const oddscolumns = 'asianList,goalList,cornerList,oddsList,asianHalfList,goalHalfList,cornerHalfList,oddsHalfList';


// const match_url = tc_root + '/match/view/{match_id}?columns=' + matchcolumns + '&token=' + token
// const odds_url = tc_root + '/match/odds/{match_id}?columns=' + oddscolumns + '&token=' + token
const today_url = tc_root + '/match/schedule?&token=' + token

function match_url(match_id, columns=matchcolumns) {
    return tc_root + '/match/view/' + match_id + '?columns=' + matchcolumns + '&token=' + token
}

function odds_url(match_id, columns=oddscolumns) {
    return tc_root + '/match/odds/' + match_id + '?columns=' + columns + '&token=' + token
}

function league_schedule_url(league_id, page='1') {
    return tc_root + '/league/schedule/' + league_id + '?token=' + token + '&page=' + page
}

// Initialize request queue
var request_queue = [];  // order doesn't really matter
var looping = false      // true if currently looping

// MongoDB
console.log("Mongo connecting...")
mongoose.connect('mongodb://localhost:/soccer', {connectTimeoutMS: 1000}).then(
    () => { console.log("Mongoose connected.") },
    (err) => { console.log("Failed to connect: ", err) }
);


// Scrape callstack:
// get_current_leagues -> parse_leagues -> validate response
//  - ensure leagues are added to mongodb
//  - if a league is not in MongoDB, add it & scrape league for new matches and add them to mongodb
//  - query mongodb for any matches that should have begun but have no data
//  - fire a request to totalcorner for each match and update mongo as they come in.

function tc_request(url, handler) {
    // Adds new requests to a queue so as not to overwhelm the API.
    console.log(">> GET ", url)
    request_queue.push([url, handler])
    if (!looping) {
        looping = true
        loop()
    }
}

function get_current_leagues() {
    // main entry point
    tc_request(today_url, parse_leagues)
}

function parse_leagues(err, res) {
    if (err !== null) {
        console.log('Error while requesting ' + today_url)
        console.log(err);
        return;
    }

    var data = JSON.parse(res.body)
    if (data['success'] != '1') {
        console.log('API call failed.')
        return
    }

    leagues = new Set()
    for (game of data['data']) {
        leagues.add(game['l_id']);
    }
    for (id of leagues) {
        // Get the matches for the league.
        url = league_schedule_url(id)
        tc_request(url, parse_matches_from_league)
    }
}


function parse_matches_from_league(err, res) {
    if (err !== null) {
        console.log('Unable to get matches from league: ', err)
        return
    }

    var data = JSON.parse(res.body)
    if (data.success != '1') {
        console.log('Unable to get matches from league. API returned fail message: ', err)
        return
    }
    
    var league_id = data.data.league.league_id
    // Got some data, let's get all the pages
    if (parseInt(data.pagination['current']) == 1) {
        console.log(res.url)

        for (var i=2; i < parseInt(data.pagination['pages']); i++) {
            url = 
        }
    }
    for (match in data.data.matches) {
        data.data.matches[match]
    }
}

function parse_match_data(err, res) {
    if (err !== null) {
        console.log("Error while parsing match;", err);
        return
    }
    if (res !== null) {
        // console.log('res:', res.body);
    } else {
        console.log('res: null');
    }
}

function parse_odds_data(err, res) {
    if (err !== null) {
        console.log("Error while parsing match;", err);
        return
    }
    if (res !== null) {
        // console.log('res:', res.body);
    } else {
        console.log('res: null');
    }
}

function loop() {
    // A timed loop to ensure we don't blow our API quota.
    if (request_queue.length > 0 && looping) {
        args = request_queue.pop()
        request(args[0], args[1])
        setTimeout(loop, 3000);
    } else {
        looping = false
    }
}


module.exports = { 'scrape': get_current_leagues }
