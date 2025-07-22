const Subsection= require('../models/Subsection');
const Section = require('../models/Section');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
require("dotenv").config();

exports.createSubSection = async(req,res)=>{
    try{
            const {title,description, timeDuration, sectionId} = req.body;
            //videourl
            console.log(req.body)
            const video = req.files?.videoFile;
            console.log(video);

            if(!title|| !description || !timeDuration || !video){
                return res.status(400).json({
                    success:false,
                    message:"All fields are requied"
                })
            }

            // upload image to cludinary

            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME)

            // create a subsection
            const subSectionDetails = await Subsection.create({
                title:title,
                description:description,
                timeDuration:timeDuration,
                videoUrl:uploadDetails.secure_url
            })

            // update section with this subsection id 

            const updatedSectionDetails = await Section.findByIdAndUpdate(sectionId,{
                $push:{
                    subSection:subSectionDetails._id
                }

            }, {new:true}).populate("subSection")

            return res.status(200).json({
                success:true,
                message:"subsection created successfully",
                updatedSectionDetails
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

exports.updateSubSection = async(req,res)=>{
    try{
        const {title, description,  subSectionId} = req.body;

        let updatedSubSection = await Subsection.findByIdAndUpdate(subSectionId, {title, description}, {new:true});

        if(!updatedSubSection){

            console.log('Something went wrong while updating subsection')
        }

        return res.status(200).json({
            success:true,
            message:"All good to resolve"
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"something wrong while updating the subsection"
        })
    }
}

exports.deleteSubSection = async(req,res)=>{
    try{
        let {subSectionId, sectionId} = req.body;

        await Section.findByIdAndUpdate(sectionId,
            {
                $pull:{
                subSection:subSectionId
            }}
        ) 

        const subSectionUpdate =  await Subsection.findByIdAndDelete(subSectionId);

        if(!subSectionUpdate){
            return res.status(404).json({
                success:false,
                message:"something wrong there will be no subSection exist with this id"

            })
        }

        return res.status(200).json({
            success:true,
            message:"Subsection deleted successfully"
        })


    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Something wrong while deleting subsection"
        }
        )

    }


    
}