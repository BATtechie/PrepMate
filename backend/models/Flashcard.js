import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
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
    cards: [{
        question: { 
            type: String, 
            required: true 
        },
        answer: { 
            type: String, 
            required: true 
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        },
        lastReviewed: { 
            type: Date, 
            default: null 
        },
        reviewCount: { 
            type: Number, 
            default: 0 
        },
        isStarted: { 
            type: Boolean, 
            default: false 
        },
    }],
},{
    timestamps: true
});


flashcardSchema.index({ userID: 1, documentID: 1 });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

export default Flashcard;       