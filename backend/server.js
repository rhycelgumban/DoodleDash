
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const db = require("./db");

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

// WELCOME ROUTE
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to the DoodleDash API!",
        status: "running"
    });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "DoodleDash backend is working."
    });
});

// GET A RANDOM WORD
app.get("/api/words/random", (req, res) => {
    const sql = `
        SELECT word_id, word
        FROM words
        WHERE is_active = TRUE
        ORDER BY RAND()
        LIMIT 1
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching random word:", err.message);
            return res.status(500).json({
                message: "Failed to fetch a random word."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No words available."
            });
        }

        res.json(results[0]);
    });
});

// SAVE A COMPLETED GAME
app.post("/api/games/score", (req, res) => {
    const username = String(req.body.username || "").trim();
    const score = Number(req.body.score);

    if (!username || username.length > 30) {
        return res.status(400).json({
            message: "Name must contain 1 to 30 characters."
        });
    }

    if (!Number.isInteger(score) || score < 0 || score > 10) {
        return res.status(400).json({
            message: "Score must be a whole number from 0 to 10."
        });
    }

    db.beginTransaction((transactionError) => {
        if (transactionError) {
            console.error(transactionError);
            return res.status(500).json({
                message: "Could not start saving the game."
            });
        }

        // Find existing player or create a new one.
        const playerSql = `
            INSERT INTO players (username)
            VALUES (?)
            ON DUPLICATE KEY UPDATE
            player_id = LAST_INSERT_ID(player_id)
        `;

        db.query(playerSql, [username], (playerError, playerResult) => {
            if (playerError) {
                return db.rollback(() => {
                    console.error(playerError);
                    res.status(500).json({
                        message: "Could not save player."
                    });
                });
            }

            const playerId = playerResult.insertId;
            const roomCode = crypto.randomBytes(5).toString("hex").toUpperCase();

            // Create a completed game record.
            const gameSql = `
                INSERT INTO games (room_code, status)
                VALUES (?, 'finished')
            `;

            db.query(gameSql, [roomCode], (gameError, gameResult) => {
                if (gameError) {
                    return db.rollback(() => {
                        console.error(gameError);
                        res.status(500).json({
                            message: "Could not create game record."
                        });
                    });
                }

                const gameId = gameResult.insertId;

                // Save this player's score for the game.
                const scoreSql = `
                    INSERT INTO game_players (game_id, player_id, total_score)
                    VALUES (?, ?, ?)
                `;

                db.query(
                    scoreSql,
                    [gameId, playerId, score],
                    (scoreError) => {
                        if (scoreError) {
                            return db.rollback(() => {
                                console.error(scoreError);
                                res.status(500).json({
                                    message: "Could not save game score."
                                });
                            });
                        }

                        db.commit((commitError) => {
                            if (commitError) {
                                return db.rollback(() => {
                                    console.error(commitError);
                                    res.status(500).json({
                                        message: "Could not finish saving the score."
                                    });
                                });
                            }

                            res.status(201).json({
                                message: "Game score saved successfully!",
                                player_id: playerId,
                                username,
                                score
                            });
                        });
                    }
                );
            });
        });
    });
});

// GET TOP 5 LEADERBOARD
app.get("/api/leaderboard", (req, res) => {
    const sql = `
        SELECT
            p.player_id,
            p.username,
            best.total_score AS best_score
        FROM players p
        INNER JOIN (
            SELECT player_id, MAX(total_score) AS highest_score
            FROM game_players
            GROUP BY player_id
        ) highest
            ON p.player_id = highest.player_id
        INNER JOIN (
            SELECT player_id, total_score, MIN(joined_at) AS achieved_at
            FROM game_players
            GROUP BY player_id, total_score
        ) best
            ON best.player_id = highest.player_id
            AND best.total_score = highest.highest_score
        ORDER BY best.total_score DESC, best.achieved_at ASC
        LIMIT 5
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching leaderboard:", err.message);
            return res.status(500).json({
                message: "Could not load leaderboard."
            });
        }

        res.json(results);
    });
});

// START SERVER
app.listen(PORT, () => {
    console.log(`DoodleDash API running at http://localhost:${PORT}`);
});
