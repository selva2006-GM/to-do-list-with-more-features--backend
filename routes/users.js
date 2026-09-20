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

        const normalizedUsername = username
            .trim()
            .toLowerCase();

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        if (normalizedUsername.length < 3) {
            return res.status(400).json({
                message: "Username must be at least 3 characters"
            });
        }

        if (password.length < 5) {
            return res.status(400).json({
                message: "Password must be at least 5 characters"
            });
        }

        const existingUser = await pool.query(
            `SELECT user_id, username, email
             FROM users
             WHERE LOWER(TRIM(email)) = $1
                OR LOWER(TRIM(username)) = $2`,
            [
                normalizedEmail,
                normalizedUsername
            ]
        );

        if (existingUser.rows.length > 0) {
            const existing = existingUser.rows[0];

            if (
                existing.email &&
                existing.email.toLowerCase() === normalizedEmail
            ) {
                return res.status(409).json({
                    message: "Email already registered"
                });
            }

            return res.status(409).json({
                message: "Username already taken"
            });
        }

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
                normalizedUsername,
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

        return res.status(201).json({
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

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email or username already registered"
            });
        }

        return res.status(500).json({
            message: "Server error"
        });
    }
});


router.post("/login", async (req, res) => {
    try {
        const {
            identifier,
            password
        } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Email/username and password are required"
            });
        }

        const normalizedIdentifier = identifier
            .trim()
            .toLowerCase();

        const result = await pool.query(
            `SELECT
                user_id,
                username,
                email,
                password
             FROM users
             WHERE LOWER(TRIM(email)) = $1
                OR LOWER(TRIM(username)) = $1`,
            [normalizedIdentifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;