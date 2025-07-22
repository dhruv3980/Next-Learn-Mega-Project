const User = require('../models/User');
const Section = require('../models/Section');
const Course = require('../models/Course')


exports.createSection = async(req,res)=>{
    try{
        let {sectionName, courseid } = req.body;

        if(!sectionName || !courseid){
            return res.status(400).json({
                success:false,
                message:"Enter the valid details"
            })

        }

        let course = await Course.findById(courseid);

        if(!course){
            return res.status(401).json({
                success:false,
                message:"Enter valid course id which is created"
            })
        }

        // section create 
        let newSection = await Section.create({
            sectionName
        })

        // now update in course 

        const updatedCourse = await Course.findByIdAndUpdate(courseid, {
            $push:{
                courseContent:newSection._id
            }
        }, {new:true})
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection"
            }
        }, )

        return res.status(200).json({
            success:true,
            message:"Section create Successfully",
            updatedCourse
        })


    }
    catch(err){

            console.log(err);
            return res.status(500).json({
                success:false,
                error:err.message,
                message:"Something wrong while created Section"
            })
    }

}


exports.updateSection = async(req,res)=>{
    try{
        let {sectionName, sectionId} = req.body;
        if(!sectionName|| !sectionId){
            return res.status(401).json({
                success:false,
                message:err
            })
        }

        let section = await Section.findById(sectionId);

        if(!section){
            return res.status(404).json({
                success:false,
                message:"Something wrong while updating section you dont passvalid section id"
            })
        }

        let updateSection = await Section.findByIdAndUpdate(sectionId, {
                sectionName:sectionName
        }, {new:true})

        return res.status(200).json({
            success:true,
            message:"Section Updated Successfully",
            updateSection
        })
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"something wrong while updating session"
        })

    }


}

exports.deleteSection = async (req,res)=>{
    try{
        let {sectionId, courseId} = req.body;

        if(!sectionId|| !courseId){
            return res.status(401).json({
                success:false,
                message:"enter the section id"
            })
        }

        let section = await Section.findById(sectionId);
        if(!section){
            return res.status(401).json({
                success:false,
                message:"enter the valid section id"
            })
        }

        let deleteSection = await Section.findByIdAndDelete(sectionId);
        // todo : do we need to delete the entry from the course schema?

        let course = await Course.findByIdAndUpdate(courseId, {$pull:{courseContent:sectionId}})

        return res.status(200).json({
            success:true, 
            message:"Section delete successfully"
        })

    }
    catch(err){
        return res.status(500).json({
            success:true,
            message: "Something wrong while deleting section"
        })

    }

  
}