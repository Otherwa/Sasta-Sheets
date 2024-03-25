const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    label: String,
    timestamp: Date,
    present: Boolean,
});

const sessionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    students: {
        type: [studentSchema],
        required: true,
    }
}, { timestamps: true, versionKey: false });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 
