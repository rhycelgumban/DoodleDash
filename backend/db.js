
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "doodledash",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("Connected to DoodleDash MySQL database!");
});

module.exports = db;
