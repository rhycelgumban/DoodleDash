DoodleDash

Project Description

DoodleDash is a simple drawing and guessing game inspired by the popular "You Draw, You Guess" trend. Players are given random words to draw within a limited time. After the drawing phase, they must identify the words based on their own drawings before the guessing timer runs out.

The game evaluates the player's answers, displays the final score, and records the result in a leaderboard.

Features

- Player name entry before starting a game.
- Random word selection from a stock of 50 words.
- Ten words per game, with a 5-second drawing time for each word.
- Drawing canvas with customizable brush color and size.
- Flashback display of all completed drawings.
- Guessing phase with a 40-second time limit.
- Automatic score calculation and results display.
- Top 5 leaderboard based on each player's highest score.
- Database storage of player information and completed game scores.

Technologies Used

Frontend
- React 19
- React DOM
- Vite 8

Backend
- Node.js
- Express 5
- MySQL2
- dotenv
- CORS

Development Tools
- Nodemon
- Oxlint
- MySQL / WampServer
- Visual Studio Code
- Git and GitHub

System Architecture

DoodleDash uses a decoupled client-server architecture. The React frontend handles the user interface and game interactions, while the Node.js and Express backend provides REST API endpoints and communicates with the MySQL database.

Installation and Setup

Prerequisites
- Node.js and npm
- WampServer or another MySQL server
- Git

1. Clone the Repository
git clone https://github.com/rhycelgumban/DoodleDash.git
cd DoodleDash

2. Set Up the Database

1. Start Apache and MySQL using WampServer.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Create a database named `doodledash`.
4. Select the `doodledash` database.
5. Go to the Import tab.
6. Choose the exported `doodledash.sql` file located in the project root folder.
7. Click Import or Go to create the database tables and insert the initial data.

3. Configure the Backend

Open the backend folder:
cd backend
npm install

Create a `.env` file inside the backend folder and configure your local database connection:
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=doodledash

Update the database credentials according to your local MySQL configuration.

Start the backend:
npm run dev

The backend runs at `http://localhost:5000`.

4. Set Up the Frontend

Open another terminal at the project root:
cd frontend
npm install
npm run dev

Open the local frontend URL provided by Vite, normally:
`http://localhost:5173`

API Endpoints

| Method | Endpoint            | Description                      |
| GET    | `/`                 | Checks the backend welcome route |
| GET    | `/api/health`       | Checks backend status            |
| GET    | `/api/words/random` | Retrieves a random active word   |
| POST   | `/api/games/score`  | Saves a completed game and score |
| GET    | `/api/leaderboard`  | Retrieves the top 5 players      |

Course Concept Integration

Advanced Database
- Relational database using MySQL.
- Database tables for players, games, game participants, drawings, guesses, and words.
- Primary keys, unique constraints, indexes, and foreign key relationships.
- SQL JOIN queries for retrieving leaderboard information.
- Database transactions when saving completed game scores.
- InnoDB storage engine for relational integrity and transaction support.

Integrative Programming
- Separate frontend and backend architecture.
- React communicates with the Express backend through API requests.
- Modular backend files, including server and database configuration.
- Middleware for JSON parsing and CORS.
- Environment variables for database configuration.

Systems Integration and Architecture (SIA)
- Client-server communication.
- REST API endpoints using HTTP methods.
- JSON request and response handling.
- HTTP status codes for successful and unsuccessful requests.
- Integration between React, Express, and MySQL.

Web Systems
- React-based user interface.
- Vite development server and build tools.
- Express routing and request-response handling.
- Static frontend build support through Vite.
- Browser-to-server communication through HTTP requests.

 
Project Information

Project Name: DoodleDash  
Project Type: Web-Based Drawing and Guessing Game  
Developed By: Rhycel Gumban 
Repository: https://github.com/rhycelgumban/DoodleDash
