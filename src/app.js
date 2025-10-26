import  express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())





//routes import

import userRouter from './routes/user.routes.js'


// routes declearation

app.use("/api/v1/users", userRouter)



// for self knowing
// app.get("/", (req, res) => {
//   res.send(" Backend is live!");
// });




export { app }



/*
CORS_ORIGIN=* SET KARNA  sahi nhi hai kyunki koi bhi frontend tere backend se baat kar sakta hai  to specific url dena hoga  
*/