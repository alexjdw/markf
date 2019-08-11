mongoose = require('mongoose')
conn = mongoose.connect('mongodb://localhost:27017/soccer', {connectTimeoutMS: 1000})

var matchSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    }
}, {strict: false})

var teamSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    matches: [Number],
})

var leagueSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true
    },
    matches: [Number],
    teams: [Number],
    created_on: {
        type: Date,
        default: new Date()
    },
    updated_on: {
        type: Date,
        default: new Date()
    }
})

module.exports = {
    Match: mongoose.model('Match', matchSchema),
    Team: mongoose.model('Team', teamSchema),
    League: mongoose.model('League', leagueSchema),
}