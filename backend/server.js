const express = require("express");
const cors = require("cors");
const session = require("express-session");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// IMPORT ROUTES AND MIDDLEWARE
const apiRoutes = require("./routes/apiRoutes");
const errorHandler = require("./middleware/errorHandler");
const { getWelcome } = require("./controllers/apiController");

// DATABASE
require("./db");

// CORS CONFIGURATION
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// JSON BODY PARSING
app.use(express.json({ limit: "10mb" }));

// SESSION CONFIGURATION
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 2 * 60 * 60 * 1000
    }
}));

// WELCOME ROUTE
app.get("/", getWelcome);

// API ROUTES
app.use("/api", apiRoutes);

// CENTRALIZED ERROR HANDLER
app.use(errorHandler);

// START SERVER
app.listen(PORT, () => {
    console.log(`DoodleDash API running at http://localhost:${PORT}`);
});