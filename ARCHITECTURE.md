DoodleDash – System Architecture

1. System Overview

DoodleDash uses a decoupled client-server architecture. The frontend and backend are developed separately and communicate through REST API requests using JSON.

Frontend: React 19 with Vite

Backend: Node.js with Express 5

Database: MySQL

Database Driver: MySQL2

Session Management: express-session

2. System Architecture Diagram

+---------------------------+
|       USER / PLAYER       |
+-------------+-------------+
              |
              v
+---------------------------+
|     REACT FRONTEND        |
|       (Vite)              |
|                           |
| - Player name entry       |
| - Drawing interface       |
| - Guessing interface      |
| - Game results            |
| - Leaderboard             |
+-------------+-------------+
              |
              | HTTP / JSON
              | Session Cookie
              v
+---------------------------+
|      EXPRESS BACKEND      |
|                           |
| - API Routes              |
| - Request Validation     |
| - CORS Middleware         |
| - JSON Middleware         |
| - Session Middleware      |
| - Cookie Management       |
| - Game Score Processing   |
+-------------+-------------+
              |
              | MySQL2
              v
+---------------------------+
|       MYSQL DATABASE      |
|                           |
| - players                 |
| - games                   |
| - game_players            |
| - words                   |
| - drawings                |
| - guesses                 |
+---------------------------+

3. Database Structure

The DoodleDash database is named doodledash and contains six relational tables.

Table

Purpose

players

Stores player information and usernames

games

Stores game records and game status

game_players

Stores player participation and scores

words

Stores the available words for the game

drawings

Stores drawing-related records

guesses

Stores guessing-related records

Relationships

One player can have multiple game records through game_players.

One game can have multiple participating player records.

One game can have multiple drawings.

One player can create multiple drawings.

Each drawing references a word.

Guesses reference games, players, and drawings.

Database Integrity

InnoDB storage engine is used for transaction support and relational integrity.

Primary keys identify individual records.

Unique constraints prevent duplicate usernames and words.

Foreign keys maintain relationships between related tables.

Indexes support database lookups and queries.

4. REST API Endpoints

Method

Endpoint

Purpose

GET

/

Returns the backend welcome message

GET

/api/health

Checks backend availability

POST

/api/session

Creates a guest player session

GET

/api/words/random

Retrieves one random active word

POST

/api/games/score

Saves a completed game and player score

GET

/api/leaderboard

Retrieves the Top 5 leaderboard

Guest Session Process

The player enters a username in the React frontend.

The frontend sends the username to /api/session.

The backend validates the username.

Express Session creates a guest session.

The session stores the player's username.

The backend sends a session cookie named connect.sid.

The browser stores the cookie and sends it with subsequent requests when credentials are included.

Score Submission Process

The frontend sends the player's score to the backend.

The frontend includes the session cookie using credentials: 'include'.

The backend checks whether a valid guest session exists.

If no session exists, the backend returns an HTTP 401 response.

The backend validates the submitted score.

A database transaction begins.

The backend finds or creates the player record.

A completed game record is created.

The player's score is saved in game_players.

The transaction is committed if all operations succeed.

If an error occurs, the transaction is rolled back.

5. Backend Design Decisions

Express handles API routing and HTTP requests.

CORS allows communication from the React development server.

Express JSON middleware parses incoming JSON requests.

Express Session manages guest player sessions.

Environment variables keep database configuration and session secrets separate from source code.

Parameterized SQL queries help prevent SQL injection.

Database transactions maintain consistency when saving game scores.

Session validation prevents score submissions without an active guest session.

Session and Cookie Security

The application uses express-session to manage guest sessions.

The session cookie uses the following settings:

httpOnly: true – prevents client-side JavaScript from accessing the cookie.

secure – enabled when running in production with HTTPS.

sameSite: "lax" – provides protection against certain cross-site request attacks.

maxAge – sets the session cookie lifetime to two hours.

The session secret is stored in the backend .env file and is not committed to the public GitHub repository.

6. Frontend and Backend Integration

The React frontend communicates with the Express backend through HTTP requests.

The backend processes requests, communicates with MySQL, and returns JSON responses. The frontend uses these responses to display words, game results, and leaderboard information.

The frontend and backend run separately during local development:

Frontend: http://localhost:5173

Backend: http://localhost:5000

CORS and credential settings allow the frontend to send and receive session cookies when communicating with the backend.

7. Design Limitations

The current application is designed for individual gameplay and does not support multiplayer functionality.

The application uses the default Express MemoryStore for session management. This is suitable for local development but is not recommended for production deployment because session data is stored in server memory and is not designed for persistent or scalable session storage.