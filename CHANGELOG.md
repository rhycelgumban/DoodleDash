Changelog

All notable changes to DoodleDash are documented in this file.

November 2026

Added

Created the DoodleDash web-based drawing and guessing game.

Developed the React frontend using Vite.

Developed the Node.js and Express backend.

Connected the application to a MySQL database.

Added a collection of 50 random words.

Implemented the timed drawing and guessing phases.

Added a drawing canvas with customizable brush color and size.

Implemented the flashback display of completed drawings.

Added automatic score calculation and game results.

Implemented a Top 5 leaderboard based on players' best scores.

Added REST API endpoints for retrieving words, saving scores, and displaying the leaderboard.

Added a guest session creation endpoint (POST /api/session).

Implemented session management using express-session.

Added HTTP session cookies using the connect.sid cookie.

Configured cookie security options, including HttpOnly, Secure, and SameSite=Lax.

Required an active guest session before accepting score submissions.

Enabled credential-based communication between the React frontend and Express backend.

Improved database integrity using InnoDB, indexes, and foreign key constraints.

Added database transaction handling for completed game submissions.

Configured database credentials and session secrets using environment variables.

Added project documentation for setup, API endpoints, and system architecture.

Improved

Strengthened score submission by retrieving the player's username from the server-side session.

Improved backend session handling and request validation.

Improved database consistency by saving game records, player scores, drawings, and guesses within a transaction.