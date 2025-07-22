const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
    firstName:{
        type:String,
        trim:true,
        required:true
    },
    lastName:{
        type:String,
        required:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },

    password:{
        type:String,
        required:true

    },

    accountType:{
        type:String,
        enum:["Admin", "Student", "Instructor"],
        required:true,
    },

    active: {
      type: Boolean,
      default: true,
    },

     approved: {
      type: Boolean,
      default: true,
    },

    additionalDetails:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile",
        required:true
    },

    image:{
        type:String,
        required:true

    },
    token:{
        type:String

    },

    resetPasswordExpires:{
        type:Date,

    },

    courses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
    }],


    courseProgress:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"CourseProgress"
    }],
},
{
    
    timestamps:true,
    
});

module.exports = mongoose.model('User',userschema);