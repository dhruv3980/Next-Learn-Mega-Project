const Profile = require('../models/Profile')
const User = require('../models/User');
const Course = require('../models/Course')
const {uploadImageToCloudinary} = require('../utils/imageUploader')
exports.updateProfile = async(req,res)=>{
    // getData
    try{    
        let {dateOfBirth="", gender, about="", contactNumber} = req.body;

        // getUserid
        let id = req.user.id;

        // validation
        if(!contactNumber || ! gender || !id){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })

        }
        
        // findProfile 
        let userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;

        let updatedProfile = await Profile.findByIdAndUpdate(profileId, {
            dateOfBirth,
            gender,
            about,
            contactNumber
        })
        return res.status(200).json({
            success:true,
            message:'Profile Updated Successfully',
            updatedProfile
        })



    }
    catch(err){
        return res.status(500).json({
            success:true,
            message:err.message
        })
    }


    

}

exports.deleteAccount = async(req,res)=>{
    try{
        let id = req.user.id;

        let userDetails = await User.findById(id);

        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"user not found"
            })
        }

        //delete profile
        await Profile.findByIdAndDelete(userDetails.additionalDetails)
        // todo unenrolled user from all enrolled courses

        await Course.updateMany({studentEnrolled:id}, {
            $pull:{
                studentEnrolled:id
            }
        })

        await User.findByIdAndDelete(id)

        return res.status(200).json({
            success:true,
            message:"User deleted Successfully"
        })
        
    }
    catch(err){
        console.error("Error deleting account:", err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting the account",
            error: err.message,

    })}
}

exports.getAllUserDetails = async(req,res)=>{
    try{
        let id = req.user.id;

        let user = await User.findById(id).populate("additionalDetails").exec()

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }

        res.status(200).json({
           success: true,
            message: "User Data fetched successfully",
            data: user,
        })


    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"something wrong while fetching user details"
        })

    }
}


exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject();
    let SubsectionLength = 0;
    for (let i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      SubsectionLength = 0;
      for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce(
          (acc, curr) => acc + parseInt(curr.timeDuration),
          0
        );
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        );
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length;
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });
      courseProgressCount = courseProgressCount?.completedVideos.length;
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100;
      } else {
        const multiplier = Math.pow(10, 2);
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier;
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = Course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,

        totalStudentsEnrolled,
        totalAmountGenerated,
      };

      return courseDataWithStats;
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};