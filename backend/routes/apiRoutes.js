const express = require("express");
const router = express.Router();

const {
    createSession,
    healthCheck,
    getRandomWord,
    saveGameScore,
    getLeaderboard
} = require("../controllers/apiController");

// SESSION
router.post("/session", createSession);

// HEALTH CHECK
router.get("/health", healthCheck);

// RANDOM WORD
router.get("/words/random", getRandomWord);

// SAVE GAME SCORE
router.post("/games/score", saveGameScore);

// LEADERBOARD
router.get("/leaderboard", getLeaderboard);

module.exports = router;