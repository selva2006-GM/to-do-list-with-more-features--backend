const express = require("express");


const router = express.Router();

router.get("/index", async (req , res)=>{
    return res.status(200).json({
        Message : "Hello from index"
    });
});




module.exports = router;

