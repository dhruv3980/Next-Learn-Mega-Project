const mongoose = require('mongoose');
const mailsender = require('../utils/mailsender');
const emailTempelate = require("../mail/tempelates/emailVerification")

const otpschema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:5*60,

        
    }

    
})

async function sendVerificationEmail(email,otp){
    try{
        const mailresponse = await mailsender(email,"Verification email send from NextLearn", emailTempelate(otp))

        console.log("email sent successfully", mailresponse);
    }
    catch(error){
        console.log("error occured while sending mail", error);
    }
}

otpschema.pre('save', async function(next) {
    await sendVerificationEmail(this.email, this.otp);
    next();
    
})

module.exports = mongoose.model('Otp', otpschema) 