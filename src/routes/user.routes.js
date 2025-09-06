import {Router} from "express";
import { registerUser,loginUser,logOutUser,refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";


const router=Router();

// router.route("/register").post(registerUser);

router.post("/register",upload.fields([
    {
        name:"avatar",
        maxCount:1,
    },
    {
        name:"coverImage",
        maxCount:1,
    }
]),registerUser);

router.post("/login",loginUser);

router.post("/logout",verifyJWT,logOutUser);

router.post("/refreshtoken",refreshAccessToken)




export default router;
