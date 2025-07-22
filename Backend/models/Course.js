const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName:{
        type:String,
        required:true,
    },
    courseDescription:{
        type:String,
        required:true,
    },

    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    
    whatWillYouLearn:{
        type:String,
        required:true,

    },
    price:{
        type:Number,
        required:true,

    },

    courseContent:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Section"
    }],

    ratingAndReview:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"RatingAndReview"
    }],

    thumbnail:{
        type:String,
    },

    tag:{
        type:[String],
        required:true,
    },

    Category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category"
    },

    studentEnrolled:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        

    }],
    
    status:{
        type:String,
        enum:["Draft", "Published"]
    },
    instructions: {
    type: [String],
    },

    createdAt: { type: Date, default: Date.now },

    
})

module.exports = mongoose.model('Course', courseSchema);