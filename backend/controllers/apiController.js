const crypto = require("crypto");
const db = require("../db");
const connection = db.promise();

// CREATE GUEST SESSION
const createSession = (req, res) => {
    const username = String(req.body.username || "").trim();

    if (!username || username.length > 30) {
        return res.status(400).json({
            message: "Name must contain 1 to 30 characters."
        });
    }

    req.session.username = username;

    res.status(200).json({
        message: "Guest session created successfully!",
        username: req.session.username
    });
};

// WELCOME ROUTE
const getWelcome = (req, res) => {
    res.json({
        message: "Welcome to the DoodleDash API!",
        status: "running"
    });
};

// HEALTH CHECK
const healthCheck = (req, res) => {
    res.json({
        status: "OK",
        message: "DoodleDash backend is working."
    });
};

// GET A RANDOM WORD
const getRandomWord = (req, res) => {
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
};

// SAVE A COMPLETED GAME, DRAWINGS, AND GUESSES
const saveGameScore = async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({
            message: "Guest session expired. Please start a new game."
        });
    }

    const username = String(req.session.username).trim();
    const drawings = req.body.drawings;

    if (!username || username.length > 30) {
        return res.status(400).json({
            message: "Name must contain 1 to 30 characters."
        });
    }

    if (!Array.isArray(drawings) || drawings.length !== 10) {
        return res.status(400).json({
            message: "Exactly 10 drawings are required."
        });
    }

    const usedWordIds = new Set();

    for (const item of drawings) {
        const wordId = Number(item.word_id);

        if (!Number.isInteger(wordId) || wordId <= 0) {
            return res.status(400).json({
                message: "Invalid word ID."
            });
        }

        if (usedWordIds.has(wordId)) {
            return res.status(400).json({
                message: "Duplicate words are not allowed."
            });
        }

        usedWordIds.add(wordId);

        if (
            typeof item.drawing_data !== "string" ||
            !item.drawing_data.startsWith("data:image/png;base64,")
        ) {
            return res.status(400).json({
                message: "One or more drawings have invalid image data."
            });
        }

        if (
            typeof item.guess_text !== "string" ||
            item.guess_text.length > 100
        ) {
            return res.status(400).json({
                message: "Each guess must contain no more than 100 characters."
            });
        }
    }

    let transactionStarted = false;

    try {
        // START TRANSACTION
        await connection.beginTransaction();
        transactionStarted = true;

        // FIND OR CREATE PLAYER
        const playerSql = `
            INSERT INTO players (username)
            VALUES (?)
            ON DUPLICATE KEY UPDATE
            player_id = LAST_INSERT_ID(player_id)
        `;

        const [playerResult] = await connection.query(
            playerSql,
            [username]
        );

        const playerId = playerResult.insertId;

        // CREATE GAME RECORD
        const roomCode = crypto.randomBytes(5).toString("hex").toUpperCase();

        const gameSql = `
            INSERT INTO games (room_code, status)
            VALUES (?, 'finished')
        `;

        const [gameResult] = await connection.query(
            gameSql,
            [roomCode]
        );

        const gameId = gameResult.insertId;

        let totalScore = 0;

        // SAVE EACH DRAWING AND ITS GUESS
        for (const item of drawings) {
            const wordId = Number(item.word_id);
            const drawingData = item.drawing_data;
            const guessText = item.guess_text.trim();

            // GET THE ACTUAL WORD FROM THE DATABASE
            const wordSql = `
                SELECT word
                FROM words
                WHERE word_id = ?
                AND is_active = TRUE
            `;

            const [wordRows] = await connection.query(
                wordSql,
                [wordId]
            );

            if (wordRows.length === 0) {
                const error = new Error("A submitted word is invalid.");
                error.status = 400;
                throw error;
            }

            // CHECK THE ANSWER USING THE DATABASE WORD
            const correct =
                guessText.toLowerCase() ===
                wordRows[0].word.trim().toLowerCase();

            const pointsEarned = correct ? 1 : 0;

            totalScore += pointsEarned;

            // INSERT DRAWING
            const drawingSql = `
                INSERT INTO drawings (
                    game_id,
                    player_id,
                    word_id,
                    drawing_data
                )
                VALUES (?, ?, ?, ?)
            `;

            const [drawingResult] = await connection.query(
                drawingSql,
                [gameId, playerId, wordId, drawingData]
            );

            const drawingId = drawingResult.insertId;

            // INSERT GUESS LINKED TO THE DRAWING
            const guessSql = `
                INSERT INTO guesses (
                    game_id,
                    player_id,
                    drawing_id,
                    guess_text,
                    is_correct,
                    points_earned
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await connection.query(
                guessSql,
                [
                    gameId,
                    playerId,
                    drawingId,
                    guessText,
                    correct ? 1 : 0,
                    pointsEarned
                ]
            );
        }

        // SAVE THE FINAL SCORE
        const scoreSql = `
            INSERT INTO game_players (
                game_id,
                player_id,
                total_score
            )
            VALUES (?, ?, ?)
        `;

        await connection.query(
            scoreSql,
            [gameId, playerId, totalScore]
        );

        // COMMIT ALL RECORDS
        await connection.commit();

        res.status(201).json({
            message: "Game, drawings, and guesses saved successfully!",
            game_id: gameId,
            player_id: playerId,
            username,
            score: totalScore,
            drawings_saved: drawings.length,
            guesses_saved: drawings.length
        });

    } catch (err) {
        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError.message);
            }
        }

        console.error("Game saving error:", err.message);

        res.status(err.status || 500).json({
            message: err.status
                ? err.message
                : "Could not save the completed game."
        });
    }
};

// GET TOP 5 LEADERBOARD
const getLeaderboard = (req, res) => {
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
};

// EXPORT CONTROLLER FUNCTIONS
module.exports = {
    createSession,
    getWelcome,
    healthCheck,
    getRandomWord,
    saveGameScore,
    getLeaderboard
};
