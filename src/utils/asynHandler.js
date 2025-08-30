const asyncHandler=(rquestHandler)=>{
    (req,res,next)=>{
        Promise.
        resolve(rquestHandler(req,res,next)).
        catch((err)=>next(err))
    }

}

export {asyncHandler};