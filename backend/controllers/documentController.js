import { error } from 'console';
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

export const uploadDocument = async (req, res, next) => {
    try {
        // Support both `req.file` (single) and `req.files` (any/array)
        let file = req.file;
        if(!file && req.files && req.files.length) file = req.files[0];

        if(!file){
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file',
                statusCode: 400
            })
        }

        // Use provided title or fall back to uploaded file's original name
        let { title } = req.body;
        title = title && title.trim() ? title.trim() : file.originalname;

        if(!title){
            return res.status(400).json({
                success: false,
                error: 'Please provide a title for the document',
                statusCode: 400
            })
        }

        const baseUrl= `${req.protocol}://${req.get('host')}`;
        // const baseUrl= `http://localhost:${process.env.PORT || 4000}`;
        const fileUrl = `${baseUrl}/uploads/documents/${file.filename}`;

        const document = await Document.create({
            userID: req.user._id,
            title,
            fileName: file.originalname,
            filePath: fileUrl,
            fileSize: file.size,
            status: 'processing',
        })

        processPDF(document._id, file.path).catch(err => {
            console.error("PDF processing error:", err);
        })

        res.status(201).json({
            success: true,
            data: document,
            message: 'Document uploaded successfully. Processing in progress...'
        })
    }catch(error) {
        // Attempt to clean up any uploaded file
        try{
            if(req.file) await fs.unlink(req.file.path).catch(() => {});
            if(req.files && req.files.length) await fs.unlink(req.files[0].path).catch(() => {});
        }catch(e){}
        next(error)
    }
};


// Helper function

const processPDF = async (documentId, filePath) => {
    try{
        const { text } = await extractTextFromPDF(filePath);

        const chunks = chunkText(text, 500, 50);

        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        });
        console.log(`Document ${documentId} processed successfully.`);
    } catch(error){
        console.error(`Error processing document ${documentId}:`, error);

        await Document.findByIdAndUpdate(documentId, {
            status: 'failed'
        });
    }
}



export const getDocuments = async (req, res, next) => {
    try {
        const documents = await Document.aggregate([
            { 
                $match: { userID: new mongoose.Types.ObjectId(req.user._id) }
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentID',
                    as: 'flashcardSet'
                }
            },
            {
                $lookup: {
                    from : 'quizzes',
                    localField: '_id',
                    foreignField: 'documentID',
                    as: 'quizzes'
                }
            },
            { 
                $addFields: {
                    flashcardCount: { $size: '$flashcardSet' },
                    quizCount: { $size: '$quizzes' }
                }
            },
            {
                $project:{
                    extractedText: 0,
                    chunks: 0,
                    flashcardSet: 0,
                    quizzes: 0
                }
            }, 
            {
                $sort: { uploadDate: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    }catch(error) {
        if(req.file){
            await fs.unlink(req.file.path).catch(() => {})
        }
        next(error)
    }

};


export const getDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userID: req.user._id,
        });

        if(!document){
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        // Get counts of associated flashcards and quizzes
        const flashcardCount = await Flashcard.countDocuments({ documentId: document._id, userId: req.user._id });
        const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

        document.lastAccessed = Date.now();
        await document.save();

        const documentData = document.toObject();
        documentData.flashcardCount = flashcardCount;
        documentData.quizCount = quizCount;
        
        res.status(200).json({
            success: true,
            data: documentData
        })
    }catch(error) {
        if(req.file){
            await fs.unlink(req.file.path).catch(() => {})
        }
        next(error)
    }
};


export const deleteDocument = async (req, res, next) => {
    try {
        const document = await Document.findOne({
            _id: req.params.id,
            userID: req.user._id,
        })

        if(!document){
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                statusCode: 404
            })
        }

        await fs.unlink(document.filePath).catch(() => {});

        await document.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });


    }catch(error) {
        if(req.file){
            await fs.unlink(req.file.path).catch(() => {})
        }
        next(error)
    }
}