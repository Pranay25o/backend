import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uplaodOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";





const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        // DEBUG: Check if the user is found
        console.log("User found for token generation:", user);

        // Await these calls to get actual token strings
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        // DEBUG: See if the tokens are actually generated strings
        // console.log("Generated Access Token:", accessToken);
        // console.log("Generated Refresh Token:", refreshToken);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error in generateAccessAndRefreshToken:", error); 
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const registerUser=asyncHandler(async (req,res)=>{
    const {fullname,email,username,password}=req.body;
    console.log(fullname,email,username,password)

    if([fullname,email,username,password].some((field)=> field.trim()===""))
    {
        throw new ApiError(400,"All fiels are required");
    }
    
    const exsitUser =await User.findOne({
        $or:[{username},{email}]
    })

    if(exsitUser)
    {
       throw new ApiError(409,"Email or Username are alreay exist");
    } 
   const avatarLocalPath=req.files?.avatar[0]?.path;
   console.log("hello")
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path;
    }

    if(!avatarLocalPath)
    {
      throw new ApiError(400,"Avtar file is required");
    }

    const avatar=await uplaodOnCloudinary(avatarLocalPath);
    const coverImage=await uplaodOnCloudinary(coverImageLocalPath);

    if(!avatar)
    {
        ApiError(400,"Avtar file is required");
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    })

    const createdUser=await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser)
    {
        throw new ApiError(500,"Someting went wrong when registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd")
    )
})

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or email are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is not correct");
  }

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,   // cookie is only accessible by server
    secure: true,     // cookie sent only over HTTPS - set false for localhost
  };

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  console.log(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      user: loggedInUser,
      accessToken,
      refreshToken,
      message: "User logged in successfully",
    });
});

const logOutUser=asyncHandler(async (req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
        new:true,
    }
   )
     const options={
        httpOnly:true,
        secure:true,
    }   
    return res.status(200).clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"User logged out"));
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

   try {
     if(incomingRefreshToken)
     {
          throw new ApiError(401,"Unauthorized request");
     }
 
     const decoded=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SCREATE);
 
     const user=await User.findById(decoded?._id);
 
     if(!user)
     {
          throw new ApiError(401,"Invalid user token");
     }
 
     if(incomingRefreshToken != user?.refreshToken)
     {
         throw new ApiError(401,"Refreshed token are expired or already used");
     }
 
     const options={
         httpOnly:true,
         secure:true,
     }
 
     const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
     
     return res.cookie("accessToken",accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
        new ApiResponse(
         200,
         {accessToken,refreshToken,},
         "Access token refreshed"
     )
     )
   } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token")
   }


})
export {registerUser,loginUser,logOutUser,refreshAccessToken};

