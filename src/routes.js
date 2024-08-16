const express = require('express');
const router = express.Router();
const math = require("mathjs");

const sequences = [
    {
        startNumber: 5,
        sequence: "B+2,B*4,B/2,B-3"
    },
    {
        startNumber: 6,
        sequence: "B-5,B*8,B/4,B+3"
    }
]

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

module.exports = router;
