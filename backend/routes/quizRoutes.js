import express from 'express';
import {
    getQuizzes,
    getQuizByID,
    submitQuiz,
    getQuizResults,
    deleteQuiz
} from '../controllers/quizController.js'
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/:documentID', getQuizzes);
router.get('/quiz/:id', getQuizByID);
router.post('/:id/submit', submitQuiz);
router.get('/:id/results', getQuizResults);
router.delete('/:id', deleteQuiz);

export default router;