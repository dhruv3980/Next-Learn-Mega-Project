const User = require('../models/User');
const Category = require('../models/Category');
const {uploadImageToCloudinary} = require('../utils/imageUploader')
const Course = require('../models/Course')
const Section = require('../models/Section')
const Subsection = require('../models/Subsection')
const CourseProgress = require('../models/CourseProgress')
const {convertSecondsToDurations} = require('../utils/secToDuration')

// create course handler function
exports.createCourse = async(req,res)=>{
    try{
        // fetch data
        const {courseName, courseDescription, whatWillYouLearn, price,
             tag, 
             category, 
            
             instructions,
            } = req.body;

          let status  = req.body.status;

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

           

        // validation 
        if(!courseName|| !courseDescription ||!whatWillYouLearn || !price || !tag.length 
            || !category || !thumbnail || !instructions.length
        ) {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        if (!status || status === undefined) {
            status = "Draft";
        }

        // check for instructor
        const instructorId = req.user.id;

        // check given category is valid or not 
        const CategoryDetails = await Category.findById(category);
        if(!CategoryDetails){
            return res.status(404).json({
                success:false,
                message:"Tag  details not found"
            })
        }

        // upload image to cloudinary

        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.Folder_NAME);

        // crate new entry in the course 
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorId,
            whatWillYouLearn,
            price,
            tag,
            Category:CategoryDetails._id,
            thumbnail:thumbnailImage.secure_url,
            status:status,
            instructions
        })



        // user ko update kerna ha 
        await User.findByIdAndUpdate(instructorId,
            {
                $push:{
                    courses:newCourse._id
                }
            }, {new:true}
        )

        // update the category ka schema
         await Category.findByIdAndUpdate({
            _id:CategoryDetails._id

         }, {
            $push:{
                courses:newCourse._id
            }
         }, {new:true}

         )


         // return response

         return res.status(200).json({
            success:true,
            message:"Course created Successfully"
         })

    }
    catch(err){

        console.log(err);
        return res.status(500).json({
            success:true,
            message:"Failed to create course"
        })

    }
}

exports.editCourse = async(req,res)=>{
    try{
        const {courseId} = req.body;
        const updates = req.body;
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: "Course not found" });

        if (req.files) {
            console.log("thumbnail update");
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
        );
        course.thumbnail = thumbnailImage.secure_url;
        }
          
        for (const key in updates) {
          if (updates.hasOwnProperty(key)) {
            if (key === "tag" || key === "instructions") {
              course[key] = JSON.parse(updates[key]);
            } else {
              course[key] = updates[key];
            }
          }
        }

        await course.save();

        const updatedCourse = await Course.findOne({
            _id: courseId,
        })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("Category")
      .populate("ratingAndReview")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

       res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });

    }



    }catch(error){

          console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });

    }
}
// get all courses handler function
exports.getAllCourses = async(req,res)=>{
    try{
        const allCourses = await Course.find({}, {
            courseName:true,
            price:true,
            thumbnail:true,
            instructor:true,
            
        }, {status:"Published"}).populate("instructor").exec()

        return res.status(200).json({
            success:true,
            message:"Data all courses fatched successfully",
            data:allCourses
        })
    }
    catch(err){
        console.log(err);
        return res.status.json({
            success:false,
            message:"Can't Fatch course data",
            error:err.message
        })
    }

}

// getcourse details

exports.getCourseDetails = async (req,res)=>{
    try{
        // get id
        const {courseId} = req.body;

        // find course details
        const courseDetails = await Course.findById(courseId)
        .populate({
            path:"instructor",
            populate:{
                path:"additionalDetails"
            }
        })
        .populate("Category")
        .populate("ratingAndReview")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
                select:"videoUrl"
            }
        }).exec();

        // validation
        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:"could not found the course with thr ${courseId}"
        })
        }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

            const totalDuration = convertSecondsToDurations(totalDurationInSeconds);
        // return res 
        return res.status(200).json({
            success:true,
            message:"Course Details fetched successfully",
              data: {
                courseDetails,
                totalDuration,
              },
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



exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("Category")
      .populate("ratingAndReview")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });

    console.log("courseProgressCount : ", courseProgressCount);

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDurations(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructorCourses = await Course.find({
      instructor: instructorId,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const studentsEnrolled = course.studentEnrolled;
    for (const studentId of studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    const courseSections = course.courseContent;
    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId);
      if (section) {
        const subSections = section.subSection;
        for (const subSectionId of subSections) {
          await Subsection.findByIdAndDelete(subSectionId);
        }
      }

      await Section.findByIdAndDelete(sectionId);
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



