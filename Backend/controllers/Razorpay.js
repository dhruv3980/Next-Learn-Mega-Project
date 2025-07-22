const {instance} = require('../config/razorpay')
const Course = require('../models/Course');
const User = require('../models/User')
const mailsender = require('../utils/mailsender')
const {courseEnrollmentEmail} = require('../mail/tempelates/courseEnrollmentEmail')
const mongoose = require('mongoose')

// capture a payment and initiate the payment request

exports.capturePayment = async(req,res)=>{
    try{
        // get userid and courseid
        const {course_id} = req.body;
        const userId = req.user.id;

        // validation
        // valid course id
        if(!course_id){
            return res.status(401).json({
                success:true,
                message:"provide the valid course id"
            })
        }

        // valid coursedetails 
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.json({
                    success:false,
                    message:"Could not find the course "
                })
            }
            // user already pay for the same course check
           const uid = new mongoose.Types.ObjectId(userId);


            if(course.studentEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"Student is already enrolled"
                })
            }
        }
        catch(err){
            console.log(err);
            return res.status(500).json({
                success:false,
                message:err.message
            })
        }

        // order create 
        const ammount = course.price;
        const currency = "INR";

        const options ={
            ammount:ammount*100,
            currency,
            receipt:Math.random(Date.now().toString),

            notes:{
                courseId:course_id,
                userId
            }

        }

        try{
            // initiate the payment using razorpay
            const paymentResponse = await instance.orders.create(options);

            console.log(paymentResponse)

            return res.status(200).json({
                success:true,
                courseName:course.courseName,
                courseDescription : course.courseDescription,
                thumbnail : course.thumbnail,
                orderId : paymentResponse.id,
                currency:paymentResponse.currency,
                ammount:paymentResponse.ammount
            })
        }
        catch(err){
            console.log(err);
            return res.status(200).json({
                success:false,
                message:"could not initate order"

            })

        }


    }
    catch(error){
        console.log(error);
        return res.json({
            success:true,
            message:"Could not initiate order"
        })
    }

} 


// verify signature
exports.verifyPayment= async(req,res)=>{
    const webhooksecret = "12345678";

    const signature = req.headers("x-razorpay-signature")

    const shasum =crypto.createHmac('sha256', webhooksecret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest('hex');

    if(signature===digest){
        console.log("Payment is authorized");

        const {courseId, userId} = req.body.payload.payment.entity.notes;

        try{
            // full fill the section 
            // find the course and enroll in it
            const enrolledCourse = await Course.findByIdAndUpdate(courseId, {
                $push:{
                    studentEnrolled:userId 

                }
            } , {new:true})

            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"Course Not Found"
                })
            }

            // find the student and update it
            const enrolledStudent = await User.findOne({_id:userId}, {$push:{courses:courseId}}, {new:true})

            console.log(enrolledCourse);
            const emailResponse =await mailsender( 
                enrolledStudent.email,
                "Congratulation from NextLearn",
                "congratulations, you are onboarding into new nextLearn course"
            )

            console.log(emailResponse);
            return res.status(200).json({
                success:true,
                message:"successfully verified and course added"
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
    else{
        return res.status(400).json({
            success:false, 
            message:"invalid request"
        })
    }
}