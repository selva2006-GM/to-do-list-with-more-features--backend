const express = require("express");

const router = express.Router();




router.get("/createtask" ,async (req , res)=>{
    console.log(req.body);
    
})


module.exports = router;