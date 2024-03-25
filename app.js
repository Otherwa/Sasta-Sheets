const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const Session = require('./model/session');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO, {});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Route to create a new session
app.post('/create-session', async (req, res) => {
    console.log(req.body)
    try {
        const { key } = req.body;
        if (key == "tatakae") {
            const { name, students } = req.body;
            const newSession = await Session.create({ name, students });
            res.json({ message: 'Session created successfully', data: newSession });
        } else {
            res.json({ message: 'Validation Issue' });
        }
    } catch (err) {
        console.error('Error creating session:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to get all sessions
app.get('/sessions', async (req, res) => {
    try {
        const sessions = await Session.find();
        res.json(sessions);
    } catch (err) {
        console.error('Error fetching sessions:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
