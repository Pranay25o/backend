import express from "express";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import 'dotenv/config';
import { app } from "./app.js";




connectDB().then(()=>{
   app.listen(process.env.PORT || 8000,()=>{
    console.log(`sever is connected :${process.env.PORT} `)
   })
}).catch((err)=>{
    console.log("mongodb connectin failed");
});




