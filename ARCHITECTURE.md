DoodleDash – System Architecture

1. System Overview

DoodleDash uses a decoupled client-server architecture. The frontend and backend are developed separately and communicate through REST API requests using JSON.

- Frontend: React 19 with Vite
- Backend: Node.js with Express 5
- Database: MySQL
- Database Driver: MySQL2

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
              v
+---------------------------+
|      EXPRESS BACKEND      |
|                           |
| - API Routes              |
| - Request Validation      |
| - CORS Middleware         |
| - JSON Middleware         |
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

The DoodleDash database is named `doodledash` and contains six relational tables.

| Table        | Purpose                                 |
| players      | Stores player information and usernames |
| games        | Stores game records and game status     |
| game_players | Stores player participation and scores  |
| words        | Stores the available words for the game |
| drawings     | Stores drawing-related records          |
| guesses      | Stores guessing-related records         |

Relationships

- One player can have multiple game records through `game_players`.
- One game can have multiple participating player records.
- One game can have multiple drawings.
- One player can create multiple drawings.
- Each drawing references a word.
- Guesses reference games, players, and drawings.

 Database Integrity

- InnoDB storage engine is used for transaction support and relational integrity.
- Primary keys identify individual records.
- Unique constraints prevent duplicate usernames and words.
- Foreign keys maintain relationships between related tables.
- Indexes support database lookups and queries.

4. REST API Endpoints

| Method | Endpoint            | Purpose                                 |
| GET    | `/`                 | Returns the backend welcome message     |
| GET    | `/api/health`       | Checks backend availability             |
| GET    | `/api/words/random` | Retrieves one random active word        |
| POST   | `/api/games/score`  | Saves a completed game and player score |
| GET    | `/api/leaderboard`  | Retrieves the Top 5 leaderboard         |

Score Submission Process

1. The frontend sends the player's username and score.
2. The backend validates the submitted information.
3. A database transaction begins.
4. The backend finds or creates the player record.
5. A completed game record is created.
6. The player's score is saved in `game_players`.
7. The transaction is committed if all operations succeed.
8. If an error occurs, the transaction is rolled back.

5. Backend Design Decisions

- Express handles API routing and HTTP requests.
- CORS allows communication from the React development server.
- Express JSON middleware parses incoming JSON requests.
- Environment variables keep database configuration separate from source code.
- Parameterized SQL queries help prevent SQL injection.
- Database transactions maintain consistency when saving game scores.

6. Frontend and Backend Integration

The React frontend communicates with the Express backend through HTTP requests.

The backend processes requests, communicates with MySQL, and returns JSON responses. The frontend uses these responses to display words, game results, and leaderboard information.

7. Design Limitations

The current application is designed for individual gameplay. The `drawings` and `guesses` tables are part of the database structure, but the current score-saving API does not insert records into these tables.