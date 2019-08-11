const mongoose = require('mongoose');
const request = require('request');
const models = require('./models.js');

// TotalCorner api
// match columns options: 'events,odds,asian,cornerLine,cornerLineHalf,goalLine,goalLineHalf,asianCorner,attacks,dangerousAttacks,shotOn,shotOff,possession';
// odds columns options = 'asianList,goalList,cornerList,oddsList,asianHalfList,goalHalfList,cornerHalfList,oddsHalfList';

const token = 'b2140c7c5378155e';
const tc_root = 'https://api.totalcorner.com/v1'
const matchcolumns = 'cornerLine,cornerLineHalf,goalLine,goalLineHalf,shotOn,shotOff'

const today_url = tc_root + '/match/schedule?&token=' + token

function match_url(match_id, columns=matchcolumns) {
    return tc_root + '/match/view/' + match_id + '?columns=' + matchcolumns + '&token=' + token
}

// function odds_url(match_id, columns=oddscolumns) {
//     return tc_root + '/match/odds/' + match_id + '?columns=' + columns + '&token=' + token
// }

function league_schedule_url(league_id, page=1) {
    return tc_root + '/league/schedule/' + league_id + '?token=' + token + '&page=' + page
}

function league_table_url(league_id, page=1) {
    return tc_root + '/league/table/' + league_id + '?token=' + token + '&page=' + page
}

// Initialize request queue
var request_queue = [];  // order doesn't really matter
var looping = false      // true if currently looping

// MongoDB
console.log("Mongo connecting...")
conn = mongoose.connect('mongodb://localhost:27017/soccer', {connectTimeoutMS: 1000}).then(
    () => { console.log("Mongoose connected.") },
    (err) => {
        console.log("Mongoose failed to connect. Shutting down.")
        throw err;
    });


// Scrape callstack:
// get_current_leagues -> parse_leagues -> validate response
//  - ensure leagues are added to mongodb
//  - if a league is not in MongoDB, add it & scrape league for new matches and add them to mongodb
//  - query mongodb for any matches that should have begun but have no data
//  - fire a request to totalcorner for each match and update mongo as they come in.

function tc_request(url, handler) {
    // Adds new requests to a queue so as not to overwhelm the API.
    request_queue.push([url, handler])
    if (!looping) {
        looping = true
        loop()
    }
}

function add_match_to_team(match_id, team_id) {
    models.Team.findOne({id: team_id}).then(
        team => {
            if (!team) {
                team = new models.Team({
                    id: team_id,
                    matches: [match_id]
                })
            } else if (!team.matches.includes(match_id)) {
                team.matches.push(match_id)
                while (team.matches.length > 10) {
                    team.matches.shift()
                }
                console.log(team.matches.length);
            }
            team.save()
        });
}

function get_current_leagues() {
    // main entry point
    console.log("Scraping.")
    tc_request(today_url, parse_leagues)
}

function parse_leagues(err, res) {
    if (err !== null) {
        console.log('Error while requesting ' + today_url)
        console.log(err);
        return;
    }

    var data = JSON.parse(res.body)
    if (parseInt(data.success) != 1) {
        console.log('Unable to get matches from league. API returned fail message: ', data.error)
        return
    }

    leagues = new Set()
    for (game of data.data) {
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
    if (parseInt(data.success) != 1) {
        console.log('Unable to get matches from league. API returned fail message: ', data.error)
        return
    }

    var league_id = data.data.league.league_id
    
    models.League.findOne({id: league_id}).then(
        mongo_league => {
            var force = false;
            let page;
            let updatetime;
            if (!mongo_league) {
                mongo_league = new models.League({
                    id: league_id,
                    matches: [],
                    teams: [],
                    created_on: new Date(),
                    updated_on: new Date()
                    });
                force = true // force getting more pages if the league has never been registered
            }

            // Check if we need to get more records to catch up
            page = parseInt(data.pagination.current)
            if (data.pagination.next) {
                // Process the next page if needed.
                url = league_schedule_url(league_id, page=page + 1)
                tc_request(url, parse_matches_from_league)
            }

            for (match of data.data.matches) {
                let m_id = parseInt(match.id)
                let murl = match_url(match.id)

                // let ourl = odds_url(match.id)   // no need for this one right now
                tc_request(murl, parse_match_data)
                // tc_request(ourl, parse_odds_data)
                if (!mongo_league.matches.includes(m_id)) {
                    mongo_league.matches.push(m_id)
                }
            }

            mongo_league.created_on = new Date()
            mongo_league.updated_on = new Date()
            mongo_league.save();
        });
}

function parse_match_data(err, res) {
    if (err !== null) {
        console.log("Error while parsing match;", err);
        return
    }

    var data = JSON.parse(res.body)
    if (parseInt(data.success) != 1) {
        console.log('Unable to get matches from league. API returned fail message: ', data.error)
        return
    }

    let match = data.data[0]

    models.Match.updateOne({id: match.id}, match, {upsert: true, setDefaultsOnInsert: true})
        .then(match => {
        })
        .catch(err => {
            console.log(err, match)
        })
    add_match_to_team(match.id, parseInt(data.data[0].h_id))
    add_match_to_team(match.id, parseInt(data.data[0].a_id))
}

// function parse_odds_data(err, res) {
//     if (err !== null) {
//         console.log("Error while parsing match;", err);
//         return
//     }
//     var data = JSON.parse(res.body)
//     update_or_add_record(data.data)
// }

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
