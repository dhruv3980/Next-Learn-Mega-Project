const mongoose = require('mongoose');

const profileschema = new mongoose.Schema({
    gender: {
        type: String,
        default: null, // allow null
    },
    dateOfBirth: {
        type: Date,
        default: null, // allow null
    },
    about: {
        type: String,
        default: null, // allow null
    },
    contactNumber: {
        type: Number,
        default: null, // allow null
    }
});

module.exports = mongoose.model('Profile', profileschema);
