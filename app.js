

const express = require("express");
const cors = require("cors");
const app = express();


const createtask = require("./routes/createTask.js");
const user = require("./routes/users.js");


app.use(cors())
app.use(express.json())



app.use("/", createtask);
app.use("/", user);
const PORT = process.env.PORT || 5000;


app.get("/", async (req , res) =>{


    return res.status(200).json({
        message : "Hello from server"
})
});

app.listen(PORT, () =>{
    console.log(`Server is running on port http//localhost:${PORT}`);
});
