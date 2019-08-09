const mongoose = require('mongoose');

var conn = mongoose.connect('mongodb://localhost/users')
var MatchSchema = mongoose.Schema({
    {
    "matches": [
      {
       /*** default columns ***/
        "id": {
            type: Number,
            unique: True
        },

        "h": String,
        "h_id": Number,
        "a": String,
        "a_id": Number,
        "l": String,
        "l_id": Number,
        "start": Date,
        "status": String,
        "hc": Number,
        "ac": Number,
        "hg": Number,
        "ag": Number,
        "hrc": Number,
        "arc": Number,
        "hyc": Number,
        "ayc": Number,
        "hf_hc": Number,
        "hf_ac": Number,
        "hf_hg": Number,
        "hf_ag": Number,

         /*** belowings are extra columns, need to be specified through query parameters ***/
        "events": String,
        "p_odds": [String],
        "i_odds": [String],
        "p_asian": [String],
        "i_asian": [String],
        "p_corner": [String],
        "i_corner": [String],
        "p_goal": [String],
        "i_goal": [String],
        "asian_corner": [String],
        "attacks": [Number],
        "shot_on": [Number],
        "shot_off": [Number],
        "possess": String
    ]
});

module.exports = {
    'conn': conn,
    'Match': mongoose.model('Match', MatchSchema);
}
