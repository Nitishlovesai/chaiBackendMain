import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse} from  "../utils/ApiResponse.js"


const registerUser =asyncHandler(async (req , res) =>{
    //get user detail from frontend
    // validation - not empty
    // check if user already exists: username , email
    // check for images, check for avatar
    // upload them to cloudinary ,avatar
    //create user Object - create entry in db
    // remove password and refreshtoken field from response
    // check for user creation
    // return res

    const {fullName, email, password, username} = req.body
    console.log("email", email);
    console.log("Name", fullName);



    // if(fullName===""){
    //     throw new ApiError(400, "fullName is required")
        
    // } aaisebhi likha jata hai 

    if (
        [fullName, username ,email, password].some((field)=>
        field?.trim()==="")
    ) {
        throw new ApiError(400, "All field is required")
    }

    const existedUser =await User.findOne({
        $or :[{ email },{ username }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email and username is already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new APiError(400,"Avatar file is required");
        
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) {
        throw new ApiError(400,"Avatar file is required");
        
    }


    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })

    const CreatedUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!CreatedUser){
        throw new ApiError(500, "something went wrong while registering the usser");
        
    }

    return res.status(201).json(
        new ApiResponse(200,CreatedUser, "User registered Sucessfully")
    )

    
    

})


export {registerUser}