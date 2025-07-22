const jwt =require('jsonwebtoken');
const User = require('../models/User');


require('dotenv').config()

// auth
exports.auth = async (req,res,next)=>{
    // extract token
   try{
     const token = req.cookies.token || req.body || req.header("Authorization").replace("Bearer ", "")

     // now check token is available or not
     if(!token){
        return res.status(401).json({
            success:false,
            message:"Token is missing "
        })
     }

     // verify token

     try{
        const decode  = jwt.verify(token, process.env.jwt_Secret);

        req.user = decode;
        next();
     }
     catch(err){
        return res.status(401).json({
            success:false,
            message:"Invalid or expires token"
        })
     }

   }
   catch(err){
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong during authentication",
        });

   }
}

// isStudent

exports.isStudent = async(req,res,next)=>{
  try{
      if(req.user.accountType!=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Students Only"
            })
        }

        next()
    } 
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be varified, please try again"
        })

    }
}



// is Instructor
exports.isInstructor = async(req,res,next)=>{
  try{
      if(req.user.accountType!=="Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructor Only"
            })
        }

        next()
    } 
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be varified, please try again"
        })

    }
}


// IsAdmi

exports.isAdmin = async(req,res,next)=>{
  try{
      if(req.user.accountType!=="Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin Only"
            })
        }

        next()
    } 
    catch(err){
        return res.status(500).json({
            success:false,
            message:"User role cannot be varified, please try again"
        })

    }
}