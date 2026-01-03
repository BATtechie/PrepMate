import express from 'express';
import {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
} from '../controllers/documentController.js';
import  protect  from '../middleware/auth.js';
import upload from '../config/multer.js'

const router = express.Router()

// All protected routes;
router.use(protect)

// Accept any file field to avoid 'Unexpected field' errors from clients
router.post('/upload', upload.any(), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);

export default router;