import mongoose, { Schema } from "mongoose";

const SubcriptionSchema=new Schema({
   subscriber:{
    type :Schema.Types.ObjectId,
    ref:"User"
   },
   channel:{
    type :Schema.Types.ObjectId,
    ref:"User"
   }
},{timestamps:true})

export const Subcription=new mongoose.model("Subcription",SubcriptionSchema);