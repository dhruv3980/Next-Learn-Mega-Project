const User = require('../models/User')
const mailSender = require('../utils/mailsender')
const bcrypt = require("bcrypt")
const crypto = require('crypto')

// resetpasswordtoken
exports.resetPasswordToken = async(req , res)=>{
    // fetch email from req ki body 
    // check user for this email email validation
    // token generate

    // update user by adding token and expiration time

    // create url

    // send mail containing the url

    try{
        const {email} = req.body;
        if(!email){
            return res.status(401).json({
                success:false,
                message:"Enter email Please",
            })
        }
        // now check the user exist this mail or not 
        const user = User.findOne({
            email
        });

        if(!user){
            return res.status(401).json({
                success:false,
                message:"Your email is not registered with us",
            })
        }

        // generate token
        const token = crypto.randomUUID();
        // update user by adding token and expiration time

        const updatedUser = await User.findOneAndUpdate({
            email
        },{
            token,
            resetPasswordExpires:Date.now()+5*60*1000
        }, {new:true})

        // now send the frontend link to the user email

        const url = `http://localhost:3000/update-password/${token}`

        await mailSender(email,
        "Password Reset Link",
        `
            <p>Click the link below to reset your password:</p>
            <a href="${url}" style="color: blue; text-decoration: underline;">Reset Password</a>
            <p>This link will expire in 5 minutes.</p>
        `
        )

        return res.json({
            success:true,
            message:"Email  sent successfully"
        })
    }
    catch(err){
        return res.status(500).json({
            success:false,
            message: `Something went wrong while reset password `   
        })

    }

    
}

// resetpassword

exports.resetPassword= async(req,res)=>{
        // data fetch
    try{
        const {password, confirmPassword, token} = req.body;
        // validation
        if(!password || !confirmPassword || !token){
            return res.status(500).json({
                success:false,
                message:"send the valid field something missing"
            })
        }
        if(password!==confirmPassword){
            return res.status(401).json({
                success:false,
                message:"Password Not Matched"

            })
        }
        // get userdetails from db using token
        const userDetails = await User.findOne({token});

        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:"Token is invalid"
            })
        }
        // if no entry invalid token
        // token time check
        if(userDetails.resetPasswordExpires<Date.now()){
            return res.status(400).json({
                success:true,
                message:"Token is expired, please generate your token"
            })
        }
        // hash password
        const hashpassword = await bcrypt.hash(password,10);


        // password update
        await User.findOneAndUpdate({
            token
        }, {password:hashpassword }, {new:true})
        //return response

        return res.status(200).json({
            success:true,
            message:"Password Reset Successfully"
        })
    }
    catch(err){
        console.log(err);
        
        return res.status(500).json({
            success:false,
            message: `Something went wrong while reset password `   ,
            err:err.message
        })

    }

    
}
  






// exports.resetPassword = async (req, res) => {
//   try {
//     console.log("REQ.BODY: ", req.body);

//     const { password, confirmPassword, token } = req.body;

//     // Validation
//     if (!password || !confirmPassword || !token) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(401).json({
//         success: false,
//         message: "Passwords do not match",
//       });
//     }

//     // Get user details from DB using token
//     const userDetails = await User.findOne({ token });

//     if (!userDetails) {
//       return res.status(401).json({
//         success: false,
//         message: "Token is invalid",
//       });
//     }

//     // Token time check
//     if (userDetails.resetPasswordExpires < Date.now()) {
//       return res.status(401).json({
//         success: false,
//         message: "Token has expired, please generate a new one",
//       });
//     }

//     // Hash new password
//     const hashpassword = await bcrypt.hash(password, 10);

//     // Update password & clear token
//     await User.findOneAndUpdate(
//       { token },
//       {
//         password: hashpassword,
//         token: undefined,
//         resetPasswordExpires: undefined,
//       },
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Password reset successfully",
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while resetting password",
//       error: err.message,
//     });
//   }
// };
