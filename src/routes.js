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


router.post('/create-account', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please enter username and password' });
        }

        // if username already exists
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
        stmt.get(username, function (err, row) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to create account' });
            }
            if (row) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            } else {
                // create account
                const stmt2 = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
                stmt2.run(username, password, function (err) {
                    if (err) {
                        return res.status(500).json({ success: false, message: 'Failed to create account' });
                    }
                    res.json({ success: true, message: 'Account created successfully' });
                });
                stmt2.finalize();
            }
        });
        stmt.finalize();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to create account' });
    }
})


router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please enter username and password' });
        }
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`);
        stmt.get(username, password, function (err, row) {
            if (err) {
                return res.status(500).json({ success: false, message: 'Failed to login' });
            }
            if (!row) {
                return res.status(400).json({ success: false, message: 'Invalid username or password' });
            } else {
                res.json({ success: true, message: 'Login successful' });
            }
        });
        stmt.finalize();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to login' });
    }
})


router.post('/save-score', (req, res) => {
    const { score, username } = req.body;

    if (typeof score !== 'number') {
        return res.status(400).json({ success: false, message: 'Invalid score' });
    }

    const stmt = db.prepare(`INSERT INTO scores (username, score) VALUES (?, ?)`);
    stmt.run(username, score, function (err) {
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


router.post('/player-stats', (req, res) => {
    try {
        const { username } = req.body;
        console.log(username)
    
        if (!username) {
            return res.status(400).json({ success: false, message: 'Please enter username' });
        }
    
        const dateToday = new Date();
        const month = (dateToday.getMonth() + 1).toString().length > 1 ? (dateToday.getMonth() + 1).toString() : "0" + (dateToday.getMonth() + 1).toString()
        const day = (dateToday.getDate()).toString().length > 1 ? (dateToday.getDate()).toString() : "0" + (dateToday.getDate()).toString()
        const date = `%${dateToday.getFullYear()}-${month}-${day}%`;
    
        db.get(
            `SELECT AVG(score) as averageScore, MAX(score) as highestScore FROM scores WHERE createdDate LIKE ? AND username = ?`,
            [date, username],
            (err, row) => {
                if (err) {
                    console.log(err)
                    return res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
                }
                console.log("row", row)
    
                const averageScore = row.averageScore || 0; // Default to 0 if no scores found
                const highestScore = row.highestScore !== null ? row.highestScore : 0; // Default to 0 if no scores found
                res.json({ success: true, averageScore, highestScore });
            }
        );
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve stats' });
    }
})


router.post('/player-streak', (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ success: false, message: 'Please enter username' });
        }

        db.all(
            `SELECT DISTINCT createdDate 
             FROM scores 
             WHERE username = ? 
             ORDER BY createdDate DESC`,
            [username],
            (err, rows) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ success: false, message: 'Failed to retrieve streak' });
                }

                let streak = 0;
                let lastDate = null;

                for (const row of rows) {
                    const currentDate = new Date(row.createdDate);

                    if (!lastDate) {
                        streak = 1;
                    } else {
                        const previousDate = new Date(lastDate);
                        previousDate.setDate(previousDate.getDate() - 1);

                        if (currentDate.toDateString() === previousDate.toDateString()) {
                            streak += 1;
                        } else {
                            break;
                        }
                    }

                    lastDate = currentDate;
                }

                res.json({ success: true, streak });
            }
        );
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve streak' });
    }
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
