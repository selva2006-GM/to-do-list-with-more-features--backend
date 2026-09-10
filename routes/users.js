const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const pool = require("../database/database");

router.post("/signup", async (req, res) => {
    try {
        const {
            username,
            email,
            password
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (
                username,
                email,
                password
            )
            VALUES ($1, $2, $3)
            RETURNING user_id, username, email`,
            [
                username,
                normalizedEmail,
                passwordHash
            ]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            {
                userId: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(201).json({
            message: "Signup successful",
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {

        console.error("SIGNUP ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


router.get("/login", async (req, res)=>{

    const result = await pool.query("Select* from users");
    console.log(result);

    res.status(200).json({
        Message :  result["rows"]
    })
})
module.exports = router;

