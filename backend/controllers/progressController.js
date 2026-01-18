import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';

export const getDashboard = async (req, res, next) => {
    try{
        const userID = req.user._id;
 
        const totalDocuments = await Document.countDocuments({ userID });
        const totalFlashcardSets = await Flashcard.countDocuments({ userID });
        const totalQuizzes = await Quiz.countDocuments({ userID });
        const completedQuizzes = await Quiz.countDocuments({ userID, completed: { $ne: null } });

        const flashcardSets = await Flashcard.find({ userID});
        let totalFlashcards = 0;
        let reviewedFlashcards = 0;
        let starredFlashcards = 0;
        
        flashcardSets.forEach(set => {
            totalFlashcards += set.cards.length;
            reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
            starredFlashcards += set.cards.filter(c => c.isStarred).length;
        });

        const quizzes = await Quiz.find({ userID, completedAt: { $ne: null } });
        const averageScore = quizzes.length > 0
            ? Math.round(quizzes.reduce((sum, q) => sum + q.scores, 0) / quizzes.length)
            : 0 ;

        const recentDocuments = await Document.find({ userID})
            .sort({ lastAccessed: -1})
            .limit(5)
            .select('title fileName lastAccessed status');

        const recentQuizzes = await Quiz.find({ userID })
        .sort({ createdAt: -1})
        .limit(5)
        .populate('documentID', 'title')
        .select('title score totalQuestions createdAt');
        
        const studyStreak = Math.floor(Math.random() * 7) + 1

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalDocuments,
                    totalFlashcardSets,
                    totalFlashcards,
                    reviewedFlashcards,
                    starredFlashcards,
                    totalQuizzes,
                    completedQuizzes,
                    averageScore,
                    studyStreak,
                },
                recentActivity: {
                    documents: recentDocuments,
                    quizzes: recentQuizzes,
                }
            }
        })
    }catch(error){
        next(error)
    }
}