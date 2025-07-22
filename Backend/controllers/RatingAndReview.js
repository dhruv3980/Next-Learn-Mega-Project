const RatingAndReview= require('../models/RatingAndReview')
const Course = require('../models/Course');

const User = require('../models/User');

// createRating  
exports.createRating = async(req,res)=>{
    try{
            // get user id
            const userId = req.user.id;
            // fetch data from req body
            const {rating, review, courseId} = req.body;
            // check if user is enrolled or not
            const courseDetails = await Course.findOne(
                {_id:courseId, 
                    studentEnrolled:{$elemMetch:{$eq:userId}}
                }
            )
            if(!courseDetails){
                return res.status(404).json({
                    success:false,
                    message:"student is not enrolled in the course"
                })
            }
            // check user already reviewed the course
            const alreadyReviewed = await RatingAndReview.findOne({
                user:userId,
                course:courseId
            })
            if(alreadyReviewed){
                return res.status(403).json({
                    success:false,
                    message:"Course is already reviewed by the user "
                })
            }
    
            // create review and rating
            const ratingReview = await RatingAndReview.create({
                rating,
                review,
                course:courseId,
                user:userId
            })
            // update course with rating and review
            await Course.findByIdAndUpdate(courseId,
                {
                    $push:{
                        ratingAndReview:ratingReview._id
                    }
                }, {new:true}

            )

            //return response
            return res.status(200).json({
                success:true,
                message:"Rating and Review Successfully"
            })
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })

    }
}

// getAvgRating

exports.getAverageRating = async (req,res)=>{
    try{
        // getcourse id
        const {courseId} = req.body;

        // calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId)
                },
            },
            {
                $group:{
                    _id:null,
                    averageRating:{$avg: "$rating"}
                }
            }
        ])

        if(result.length>0){
            return res.status(200).json({
                successLtrue,
                averageRating : result[0].averageRating
            })
        }

        // if no rating exist 
        return res.status(200).json({
            success:true,
            message:"Average rating is 0 till now no rating ",
            averageRating:0
        })


    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })

    }
}


//getAllRating

exports.getAllRatingReview = async (req,res)=>{
    try{

        const allReview = await RatingAndReview.find({}).sort({rating:"desc"})
        .populate({
            path:"course",
            select:"courseName"
        })
        .populate({
            path:"user",
            select:"firstName, lastName, email , image"
        })

        return res.status(200).json({
            success:true,
            message:"All reviewed fetched successfully",
            data:allReview

        })
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:err.message
        })

    }
      
}