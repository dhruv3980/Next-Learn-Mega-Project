const mongoose = require('mongoose');
require('dotenv').config();

const dbconnect = ()=>{
    mongoose.connect(process.env.mongodb_Url)
    .then(()=>{
        console.log("successfully connected to db");

    }).catch(err=>{
        console.log("Database connection failed",err)
    })
}

module.exports = dbconnect;