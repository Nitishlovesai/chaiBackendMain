import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"

import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {ApiResponse} from  "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) =>
    {
        try {
            const user = await User.findById(userId)
            const accessToken =user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()


            user.refreshToken = refreshToken
            await user.save({validateBeforeSave: false})

            return {accessToken, refreshToken}
            
        } catch (error) {
            throw new ApiError(500, "Something went wrong while generating refresh and access token")
        }
    }


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
    console.log("Body" , req.body);
    console.log("FILES" , req.files);
    
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log("Avatar Path:", avatarLocalPath);
    console.log("Cover Path:", coverImageLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required");
        
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    console.log("CLOUDINARY AVATAR RESPONSE:", avatar); 
    console.log("CLOUDINARY COVER RESPONSE:", coverImage);


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

    const CreatedUser =await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!CreatedUser){
        throw new ApiError(500, "something went wrong while registering the user");
        
    }

    return res.status(201).json(
        new ApiResponse(200,CreatedUser, "User registered Sucessfully")
    )

    
    

})

const loginUser = asyncHandler(async (req , res) =>{
    //req body
    //username or email se login
    //find the user
    //password check
    //access token and refreshtoken
    //send cookie

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400, "username and email is required")
    }
    // findOne finds the condition you provided like here email and username
    const user =await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400, "User is not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user Credentials")
    }
    const {accessToken ,refreshToken} =await generateAccessAndRefreshTokens(user._id)

    const loggedInUser  =await User.findById(user._id).
    select("-password -refreshToken")


    const options = {
    httpOnly: true,
    secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken" ,refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                //if i set it in cookie why you send it in user , because suppose you are 
                //building a mobile appication  aur user save karna chah raha hai
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options ={
        httpOnly:true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req , res)=>
    {
    const incomingRefreshToken = req.cookie.
        refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized Request")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken!==refreshToken){
            throw new ApiError(401 ,"Refresh Token is used or expired")
        }
    
        const options ={
            httpOnly:true,
            secure: true
        }
    
        
        const {accessToken ,newRefreshToken } =await generateAccessAndRefreshTokens(user._id)
    
    
        return res
        .status(200)
        .cookie("accessToken" ,accessToken ,options)
        .cookie("refreshToken" , newRefreshToken , options)
        .json(
             new ApiResponse(200, 
                {accessToken,refreshToken: newRefreshToken},
                "AccessToken Refreshed"
             )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 
            "Invalid Refresh Token")
    }
})



const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const  {oldPassword , newPassword} = req.body
    //dataBase ko call ho rahi hai to await
    const user = await User.findById(req.user?._id)
    // isPasswordCorrect is async method so await
    const isPasswordCorrect =await user.isPasswordCorrect(oldPassword)


    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password");
        
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user ,"Current user Fetched sucessfully"))
})


const updateAccountDetails = asyncHandler(async(req , res)=>{
    const {fullName, email} =req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    //mongoDb mein bahut sare Oprater hai jaise Set,Count aggregation hai 
    const user =User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email

            }
        },
        {new: true}
    
    ).select("-password")


    return res
    .status(200)
    .json(new ApiError(200, user, "Account details updated successfully"))

})


const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const oldUser = User.findById(req.user?._id)
    const oldAvatarUrl = oldUser?.avatar

    const avatar =await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while Uploading avatar")
    }

    //deleting the old image
    if(oldAvatarUrl){
        const publicId = extractPublicId(oldAvatarUrl)
        await cloudinary.uploader.destroy(publicId)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiError(200, user, "Avatar  details updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image files is missing")
    }
    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while Uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiError(200, user, "cover Image  details updated successfully"))
})


export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

}