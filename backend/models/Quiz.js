import e from "express";
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true      
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    questions: [{
        question: {
            type: String,
            required: true
        },
        options: {
            type: [String],
            required: true,
            validate: [array => array.length === 4, 'Must have exactly 4 options']
        },
        correctAnswer: {
            type: String,
            required: true
        },
        explanation: {
            type: String,
            default: ''
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        }
    }],
    userAnswers: [{
        questionIndex: {
            type: Number,
            required: true
        },
        selectedAnswer: {
            type: String,
            required: true
        },
        isCorrect: {
            type: Boolean,
            required: true
        },
        answerAt: {
            type: Date,
            default: Date.now
        }
    }],
    scores: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})


// Index to optimize queries by userID and documentID
quizSchema.index({ userID: 1, documentID: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;