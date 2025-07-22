const nodemailer = require("nodemailer");
require('dotenv').config();

const mailsender = async(email, title, body)=>{
    try{
        
        const transporter = nodemailer.createTransport({
            
                host:process.env.HOST,
                port:process.env.PORT_SMTP,

                auth:{
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                }
            
            
        })

        let info = await transporter.sendMail({
            from:"NextLearn || Dhruv",
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info);
        return info

    }catch(err){
        console.log(err.message);

    }
}

module.exports = mailsender;  
