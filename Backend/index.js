const express = require("express");
const app = express();
const userRoutes = require("./routers/User");
const profileRoutes = require("./routers/Profile");
const courseRoutes = require("./routers/Course");
//const paymentRoutes = require("./routers/Payment");
const contactUsRoute = require("./routers/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");

const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

const PORT = process.env.PORT || 4000;
dotenv.config();



database();
 
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
	

);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);


cloudinaryConnect();



app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
//app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);



app.get("/", (req, res) => {

	return res.json({
		success: true,
		message: "Welcome To StudyNotion",
	});
});


app.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

