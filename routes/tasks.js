const express = require("express");

const router = express.Router();

const pool = require("../database/database");
const authenticateToken = require("../middleware/auth");


// =====================================================
// GET LEADERBOARD
// =====================================================

router.get("/rank", async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                RANK() OVER (
                    ORDER BY tracker_score DESC
                ) AS rank,
                user_id,
                username,
                tracker_score
            FROM tracker_score
            ORDER BY tracker_score DESC
            LIMIT 10
        `);

        res.status(200).json({
            ranks: result.rows
        });

    } catch (error) {

        console.error("RANK ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch leaderboard"
        });
    }
});


// =====================================================
// GET MY RANK
// =====================================================

router.get("/my-rank", authenticateToken, async (req, res) => {
    try {

        const result = await pool.query(
            `
            SELECT
                rank,
                user_id,
                username,
                tracker_score
            FROM (
                SELECT
                    RANK() OVER (
                        ORDER BY tracker_score DESC
                    ) AS rank,
                    user_id,
                    username,
                    tracker_score
                FROM tracker_score
            ) ranked_users
            WHERE user_id = $1
            `,
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User is not ranked yet"
            });
        }

        res.status(200).json({
            rank: result.rows[0]
        });

    } catch (error) {

        console.error("MY RANK ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch user rank"
        });
    }
});


// =====================================================
// GET ALL TASKS FOR LOGGED-IN USER
// =====================================================

router.get("/", authenticateToken, async (req, res) => {
    try {

        console.log("GET TASKS");
        console.log("USER ID:", req.userId);

        const result = await pool.query(
            `
            SELECT
                task_id,
                task_text,
                TO_CHAR(task_date, 'YYYY-MM-DD') AS task_date,
                submitted,
                completed,
                created_at
            FROM tasks
            WHERE user_id = $1
            ORDER BY task_date DESC, created_at ASC
            `,
            [req.userId]
        );

        console.log("TASKS FROM DATABASE:", result.rows);

        res.status(200).json(result.rows);

    } catch (error) {

        console.error("GET TASKS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});


// =====================================================
// CREATE TASK
// =====================================================

router.post("/", authenticateToken, async (req, res) => {
    try {

        const {
            task_text,
            task_date
        } = req.body;

        if (!task_text || !task_date) {
            return res.status(400).json({
                message: "Task text and date are required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO tasks
                (
                    user_id,
                    task_text,
                    task_date
                )
            VALUES ($1, $2, $3)
            RETURNING
                task_id,
                task_text,
                TO_CHAR(task_date, 'YYYY-MM-DD') AS task_date,
                submitted,
                completed,
                created_at
            `,
            [
                req.userId,
                task_text.trim(),
                task_date
            ]
        );

        res.status(201).json({
            message: "Task created",
            task: result.rows[0]
        });

    } catch (error) {

        console.error("CREATE TASK ERROR:", error);

        res.status(500).json({
            message: "Failed to create task"
        });
    }
});


// =====================================================
// UPDATE USER SCORE
// =====================================================

router.post("/score", authenticateToken, async (req, res) => {
    try {

        console.log("UPDATE SCORE");
        console.log("USER ID:", req.userId);

        // ---------------------------------------------
        // COUNT COMPLETED TASKS
        // ---------------------------------------------

        const taskResult = await pool.query(
            `
            SELECT COUNT(*) AS completed_tasks
            FROM tasks
            WHERE user_id = $1
              AND completed = true
            `,
            [req.userId]
        );

        const completedTasks =
            Number(taskResult.rows[0].completed_tasks);

        // 10 points per completed task
        const score = completedTasks * 10;


        // ---------------------------------------------
        // GET USERNAME
        // ---------------------------------------------

        const userResult = await pool.query(
            `
            SELECT username
            FROM users
            WHERE user_id = $1
            `,
            [req.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const username = userResult.rows[0].username;


        // ---------------------------------------------
        // INSERT OR UPDATE SCORE
        // ---------------------------------------------

        const scoreResult = await pool.query(
            `
            INSERT INTO tracker_score
                (
                    user_id,
                    username,
                    tracker_score
                )
            VALUES ($1, $2, $3)

            ON CONFLICT (user_id)
            DO UPDATE SET
                username = EXCLUDED.username,
                tracker_score = EXCLUDED.tracker_score

            RETURNING
                user_id,
                username,
                tracker_score
            `,
            [
                req.userId,
                username,
                score
            ]
        );


        console.log(
            "UPDATED SCORE:",
            scoreResult.rows[0]
        );


        res.status(200).json({
            message: "Score updated",
            score: scoreResult.rows[0]
        });

    } catch (error) {

        console.error("UPDATE SCORE ERROR:", error);

        res.status(500).json({
            message: "Failed to update score"
        });
    }
});


// =====================================================
// UPDATE TASK
// =====================================================

router.put("/:id", authenticateToken, async (req, res) => {
    try {

        const { id } = req.params;

        const {
            task_text,
            submitted,
            completed
        } = req.body;


        const result = await pool.query(
            `
            UPDATE tasks
            SET
                task_text = COALESCE($1, task_text),
                submitted = COALESCE($2, submitted),
                completed = COALESCE($3, completed)
            WHERE task_id = $4
              AND user_id = $5

            RETURNING
                task_id,
                task_text,
                TO_CHAR(task_date, 'YYYY-MM-DD') AS task_date,
                submitted,
                completed,
                created_at
            `,
            [
                task_text,
                submitted,
                completed,
                id,
                req.userId
            ]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        res.status(200).json({
            message: "Task updated",
            task: result.rows[0]
        });

    } catch (error) {

        console.error("UPDATE TASK ERROR:", error);

        res.status(500).json({
            message: "Failed to update task"
        });
    }
});


// =====================================================
// DELETE TASK
// =====================================================

router.delete("/:id", authenticateToken, async (req, res) => {
    try {

        const { id } = req.params;


        const result = await pool.query(
            `
            DELETE FROM tasks
            WHERE task_id = $1
              AND user_id = $2
            RETURNING task_id
            `,
            [
                id,
                req.userId
            ]
        );


        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found"
            });
        }


        res.status(200).json({
            message: "Task deleted"
        });

    } catch (error) {

        console.error("DELETE TASK ERROR:", error);

        res.status(500).json({
            message: "Failed to delete task"
        });
    }
});


module.exports = router;