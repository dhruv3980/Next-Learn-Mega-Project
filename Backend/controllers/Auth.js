const User = require('../models/User');
const Otp = require('../models/Otp')
const otpgenerator = require('otp-generator');
const Profile = require('../models/Profile')
const mailSender = require('../utils/mailsender')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config()
const passwordUpdated = require('../mail/tempelates/passwordUpdate')

// sendOtp
exports.sendOtp = async (req, res) => {
    try {
        console.log('OTP generation started');

        // fetch email from req.body
        const { email } = req.body;

        // validate email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Enter the Email"
            });
        }

        console.log("Email:", email);

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User is already registered",
            });
        }

        // delete old OTPs for this email
        await Otp.deleteMany({ email });

        // generate unique OTP
        let otp;
        let otpExists;
        do {
            otp = otpgenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
            otpExists = await Otp.findOne({ otp });
        } while (otpExists);

        console.log("Generated OTP:", otp);

        // store OTP in DB
        const otpDoc = await Otp.create({ email, otp });
        console.log("OTP stored:", otpDoc);

        // send OTP to email
       // await mailSender(email, "Your OTP Code", `Your OTP is: ${otp}`);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });

    } catch (err) {
        console.error("Error in sendOtp:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


exports.signup = async(req,res)=>{
    try{
        // fetch data from req ki body

        const {
            firstName,
            lastName, 
            email, 
            password,
            confirmPassword,
             
            accountType, 
            otp
        } = req.body;

        // validate kerlo
        if(!email || !firstName || !lastName || !password ||  !otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required"
            })

        }

        // 2 password match kerlo 
        if(password!==confirmPassword){
          return res.status(400).json({                 
                success:false,
                message:"Password and Confirm Password do not match. Please try again."
            })
        }

        // check user present or not if not then ok otherwise send res
        let userExist = await User.findOne({email});
        if(userExist){
            return res.status(400).json({
                success:false,
                message: "User already exists. Please sign in to continue.",
            })
        }

        // validate otp  -> for this first we find out the most recent otp in db
        let dbOtp  = await Otp.find({email}).sort({createdAt:-1}).limit(1);
        console.log(dbOtp)

        if(dbOtp.length==0){
            return res.status(400).json({
                success:false,
                message:"Otp Not found"
            })
        }
        console.log(otp);
        console.log(dbOtp);
        if(otp!=dbOtp[0].otp.toString()){
            return res.status(400).json({
                success:false,
                message:"You enter wrong otp",
                
                

            })
        }

        // hash password 
        const hashPassword= await bcrypt.hash(password,10);

        let approved = "";
        approved === "Instructor" ? (approved = false) : (approved = true);


        // db me entry create kero
        let profiledetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        }) 
        
        const user = await User.create({
            firstName,
            lastName,
            email, 
            
            password:hashPassword,
            accountType,
            approved: approved,
            additionalDetails:profiledetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`

        })
      
        return res.status(200).json({
            success:true,
            message:`User is registered successfully`,
            user
        })


    }catch(err){
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. Please try again.",
        })

    }
}



// login

exports.login = async(req,res)=>{
    try{
        // get data from req ki body
        let {email, password} = req.body;
        
        if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: `Please Fill up All the Required Fields`,
        });
        }

        // validate that user exist or not if not then return
        let existuser  = await User.findOne({email}).
        populate("additionalDetails");

        if(!existuser){
            return res.status(400).json({
                suceess:false,
                message:`User is not Registered with Us Please SignUp to Continue`,
            })
        }

        // now create token after validate the password
        if(await bcrypt.compare(password, existuser.password)){
            const payload ={
                email:existuser.email,
                id:existuser._id,
                accountType:existuser.accountType
            }
            const token = jwt.sign(payload, process.env.jwt_Secret, {expiresIn:'2h'})

            existuser = existuser.toObject()
            existuser.token = token;
            existuser.password=undefined;

            // create cookie
            const options = {
                expires:new Date(Date.now() + 3*24*60*60*1000),
                httpOnly:true
            }

            res.cookie("token", token, options).json({
                success:true,
                token,
                existuser,
                message:"Logged In Successfully"
            })

        }
        else{
            return res.status(401).json({
                success:false,
                message:`Login Failure Please Try Again`,

            })
            
        }

    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success:false,
            message:`login failure`
        })

    }
}




// changepassword

exports.changePassword = async (req, res) => {
  try {

    const userDetails = await User.findById(req.user.id);

    const { oldPassword, newPassword } = req.body;

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
      
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};

