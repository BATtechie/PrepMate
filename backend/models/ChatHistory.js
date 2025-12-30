import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
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
    messages: [{
        sender: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        releventChunks: [{
            type: String
        }]
    }],
},{
    timestamps: true    
});


// Index to optimize queries by userID and documentID
chatHistorySchema.index({ userID: 1, documentID: 1})

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistory;