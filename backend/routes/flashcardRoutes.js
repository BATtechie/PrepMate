import express from 'express';
import {
    getFlashcards,
    getAllFlashcardSets,
    reviewFlashcard,
    toggleStarFlashcard,
    deleteFlashcardSet,
} from '../controllers/flashcardController.js';
import  protect  from '../middleware/auth.js';
import { get } from 'mongoose';

const router = express.Router();

router.use(protect) 

router.get('/', getAllFlashcardSets);
router.get('/:documentId', getFlashcards);
router.post('/:cardId/review', reviewFlashcard);
router.post('/:cardId/star', toggleStarFlashcard);
router.delete('/:id', deleteFlashcardSet);

export default router;