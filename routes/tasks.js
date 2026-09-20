const express = require("express");


const router = express.Router();

const pool = require("../database/database");

const authenticationToken = require("../middleware/auth");


router.get("/", authenticationToken, async (req, res)=> {
    try{
        const result = await pool.query(
            `select
                task_id,
                task_text,
                submitted,
                completed,
                created_at
            from tasks
            where user_id = $1
            order by task_date desc, created_at asc`,
            [req.userId]
        );
        res.json(result.rows);

    }catch(error){
        console.error("GET TASKS ERROR :", error);

        res.status(500).json({
            message : "Failed to fetch tasks"
        });
    }
});


router.post("/", authenticationToken, async(req, res)=>{
    try{
        const{
            task_text, task_date, 
        } = req.body;

        if(!task_text || !task_date){
            return res.status(400).json({
                message : "Task text and date are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO tasks
                (user_id, task_text, task_date)
            VALUES ($1, $2, $3)
            RETURNING
                task_id,
                task_text,
                task_date,
                submittedm
                completed,
                created_at`,
                [req.userId, 
                    task_text,
                    task_date
                ]
        );

        res.status(201).json({
            message: "Task created",
            task: result.row[0]
        });
    }catch(error)
    {
        console.error("CREATE TASK ERROR:", error);
        res.status(500).json({
            message : "Failed to create task"
        });

    }
});



router.put("/:id", authenticationToken, async (req, res)=>{

    try{
        const { id } = res.params;
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
            
            RESTURNING 
                task_id,
                task_text,
                task_date,
                submitted,
                completed,
                created_at`,
                [task_text,
                    submitted,
                    id,
                    res.userId
                ]
        );

        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Task not found"
            });
        }

        res.json({
            message : "Task updated",
            task : result.rows[0]
        });
    }catch(error){
        console.error("UPDATE TASK ERROR: ", error);
        res.status(500).json({
            message : "Failed to update task"
        });

    }
});

router.delete("/:id", authenticationToken, async (req, res)=>{
    try{
        const { id } = req.params;

        const result =  await pool.query(
            `DELETE FROM tasks
            WHERE task_id = $1
                AND user_id = $2
            RETRUNING task_id
            `, 
            [id, req.userId]
        );

        if(result.rows.length === 0){
            return res.status(404).json({
                message : "Task not found"
            });
        }

        res.json({
            message : "Task deleted"
        });

    }catch(error){
        console.error("DELETED TASK ERROR", error);
        res.status(500).json({
            message : "Failed to delete task"
        });
    }
});




module.exports = router;