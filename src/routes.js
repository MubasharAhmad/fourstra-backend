const express = require('express');
const router = express.Router();
const math = require("mathjs");
const db = require('./db');


const sequences = [
    {
        startNumber: 5,
        sequence: "B+2,B*4,B/2,B-3"
    }
]


// Create the scores table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER,
    createdDate TEXT DEFAULT (DATE('now'))
)`);


router.post('/save-score', (req, res) => {
    const { score } = req.body;

    if (typeof score !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid score' });
    }

    const stmt = db.prepare(`INSERT INTO scores (score) VALUES (?)`);
    stmt.run(score, function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to save score' });
        }
        res.json({ success: true, message: 'Score saved successfully' });
    });
    stmt.finalize();
});


router.get('/stats-today', (req, res) => {
    const dateToday = new Date();
    const month = (dateToday.getMonth() + 1).toString().length > 1 ? (dateToday.getMonth() + 1).toString() : "0" + (dateToday.getMonth() + 1).toString()
    const day = (dateToday.getDate()).toString().length > 1 ? (dateToday.getDate()).toString() : "0" + (dateToday.getDate()).toString()
    const date = `%${dateToday.getFullYear()}-${month}-${day}%`;

    db.get(
        `SELECT AVG(score) as averageScore, MAX(score) as highestScore FROM scores WHERE createdDate LIKE ?`,
        [date],
        (err, row) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
            }
          console.log(row)

            const averageScore = row.averageScore || 0; // Default to 0 if no scores found
            const highestScore = row.highestScore !== null ? row.highestScore : 0; // Default to 0 if no scores found
            res.json({ success: true, averageScore, highestScore });
        }
    );
});


router.get('/get-sequence', (req, res) => {
    const dateToday = new Date()
    const startDate = new Date(dateToday.getFullYear(), 1, 1);
    dateToday.getHours();
    const timeDiff = dateToday - startDate;
    const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const todaySequenceNumber = diffDays % sequences.length;
    const todaySequence = sequences[todaySequenceNumber];
    const sequencs = todaySequence.sequence.split(',');
    const sequenceArray = [todaySequence.startNumber];
    let counter = 0;
    for (let i = 1; i <= 150; i++) {
        const prevBox = sequenceArray[i - 1];
        const nextBoxValue = math.evaluate(sequencs[counter].replace('B', prevBox));
        sequenceArray.push(nextBoxValue);
        if (counter === sequencs.length - 1) {
            counter = 0;
        } else {
            counter++;
        }
    }
    res.json({ sequenceArray, success: true });
});

// Route to get all scores data
router.get('/all-scores', (req, res) => {
    db.all(`SELECT * FROM scores`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve scores' });
        }
        res.json({ success: true, scores: rows });
    });
});

module.exports = router;
