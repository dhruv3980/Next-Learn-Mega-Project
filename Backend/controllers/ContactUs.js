const {contactUsEmail} = require('../mail/tempelates/contactForm');

const mailSender = require('../utils/mailsender')

exports.contactUsController = async(req,res)=>{
    try{
        const { email, firstName, lastName, message, contactNumber , countryCode} = req.body;

        try{
            await mailSender (email, "Your data Send Successfully ", contactUsEmail(email,firstName, lastName, message, contactNumber, countryCode))
            
            let em = "rathoreofficial398@gmail.com";

            await mailSender(em, "Query From the user - NextLearn", `<h1>${message}</h1>`)

            return res.json({
                success:true,
                message:"Email Sent Successfully"
            })
            
        }
        catch(err){
            console.log(err);
           return res.json({
            success: false,
            message: "Something went wrong...",
            });

        }

    }catch(err){
        return res.status(500).json({
            success:false,
            message:"Something wrong while sending information"
        })

    }

    
}