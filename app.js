

const express = require("express");
const cors = require("cors");
const app = express();


const index = require("./routes/index.js");


app.use(cors())
app.use(express.json())


app.use("/", index);

const PORT = process.env.PORT || 5000;


app.get("/", async (req , res) =>{


    return res.status(200).json({
        message : "Hello from server"
})
});

app.listen(PORT, () =>{
    console.log(`Server is running on port http//localhost:${PORT}`);
});
