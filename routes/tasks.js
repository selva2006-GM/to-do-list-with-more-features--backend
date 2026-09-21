const express = require("express");

const router = express.Router();

const pool = require("../database/database");
const authenticateToken = require("../middleware/auth");


// GET ALL TASKS FOR LOGGED-IN USER
router.get("/", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                task_id,
                task_text,
                task_date,
                submitted,
                completed,
                created_at
             FROM tasks
             WHERE user_id = $1
             ORDER BY task_date DESC, created_at ASC`,
            [req.userId]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error("GET TASKS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch tasks"
        });
    }
});


// CREATE TASK
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
            `INSERT INTO tasks
                (
                    user_id,
                    task_text,
                    task_date
                )
             VALUES ($1, $2, $3)
             RETURNING
                task_id,
                task_text,
                task_date,
                submitted,
                completed,
                created_at`,
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


// UPDATE TASK
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const {
            task_text,
            submitted,
            completed
        } = req.body;

        const result = await pool.query(
            `UPDATE tasks
             SET
                task_text = COALESCE($1, task_text),
                submitted = COALESCE($2, submitted),
                completed = COALESCE($3, completed)
             WHERE task_id = $4
               AND user_id = $5
             RETURNING
                task_id,
                task_text,
                task_date,
                submitted,
                completed,
                created_at`,
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


// DELETE TASK
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM tasks
             WHERE task_id = $1
               AND user_id = $2
             RETURNING task_id`,
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