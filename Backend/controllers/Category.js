// create tags
const Category = require('../models/Category')
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}


exports.createCategory = async(req,res)=>{
    try{

        let {name, description} = req.body;

        // check validation
        if(!name||!description){
            return res.status(401).json({
                success:false,
                message:"enter the description and name"
            })
        }

        // after check the validation now you crate enry in db

        const result = await Category.create({name, description})

        console.log(result);

        return res.status(200).json({
            success:true,
            message:"tag created successfully"
        })
}
    catch(err){

        return res.status(500).json({
            success:false,
            message:err.message,
            
        })
    }

}


// get all tags handler function

exports.showAllCategory = async(req,res)=>{
    try{
        let allCategory = await Category.find({}, {name:true, description:true}).populate("courses");

        const categoriesWithPublishedCourses = allCategory.filter((category) =>
            category.courses.some((course)=>course.status==="Published")
        
        );


        return res.status(200).json({
            success:true,
            message:"All Tags fetch Successfully",
            data:categoriesWithPublishedCourses,
        })
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

// category Page details

exports.categoryPageDetails = async(req,res)=>{
    try{
        // get category course
        const {categoryId} = req.body;

        // get course for specified category
        const selectedCourse = await Category.find({
            _id:categoryId
        })
        .populate({
            path:"courses",
            match:{
                status:"Published"
            },
            populate:"ratingAndReview"
            
        
        }

         ).exec()
        
        //validation
        if(!selectedCourse){
            return res.status(404).json({
                success:false,
                message:"Data not found"
            })
        }

        if (selectedCourse.courses.length === 0) {
            console.log("No courses found for the selected category.");
            return res.status(200).json({
                success: true,
                message: "No courses found for the selected category.",
            });
        }

        

        // get courses from different category
        const differentCategories = await Category.findOne({
            _id:{$ne:categoryId}
        })
        .populate({path:'courses',
            match: { status: "Published" },
        }).exec();


        // get top 10 selling course
         const allCategories = await Category.find()
        .populate({
            path: "courses",
            match: { status: "Published" },
        })
        .exec();
        const allCourses = allCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses
        .sort((a, b) => b.studentsEnroled.length - a.studentsEnroled.length)
        .slice(0, 10);


        //return response
        return res.status(200).json({
            success:true,
            data:{
                selectedCourse,
                differentCategories
            }
        })

    }catch(err){
        return res.status(500).json({
                success:false,
                message:err.message
            })


    }
}
