// require('dotenv').config({path: './env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
    path:'./env'
})



PORT = process.env.PORT || 8000;
connectDB()
.then(()=>{
    app.listen(PORT, ()=>{
        console.log(`Server is runing ar port ${PORT}`);
        
    })
})
.catch((err) =>{
    console.log("Mongo DB connection Failed" , err);
    
})















/*
import express from "express"
const app = express()

( async () =>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

        app.on("error" , (error) =>{
            console.log("Error :", error);
            throw error
            
        })

        app.listen(process.env.PORT , ()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("Error : ", error)
        throw error
    }
})()
*/