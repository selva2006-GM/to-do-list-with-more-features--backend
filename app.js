const express = require("express");
const cors = require("cors");

const app = express();

const user = require("./routes/users.js");
const taskRoutes = require("./routes/tasks");

app.use(cors());
app.use(express.json());

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