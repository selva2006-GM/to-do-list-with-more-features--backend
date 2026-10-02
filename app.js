const express = require("express");
const cors = require("cors");
const ratelimit = require("express-rate-limit")


const app = express();

const limiter = rateLimit({
    windowMs : 15*60*1000,
    max:100,
    message : "Too many requests from this IP, please try again later."
})



const user = require("./routes/users.js");
const taskRoutes = require("./routes/tasks");

app.use(cors());
app.use(express.json());
app.use(limiter);
app.use("/", user);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
    return res.status(200).json({
        message: ""
    });
});

app.listen(PORT, () => {
    console.log(
        `Server is running on port http://localhost:${PORT}`
    );
});