import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from '../utils/textChunker.js';
import { Chat } from '@google/genai';
import errorHandler from '../middleware/errorHandler.js';


export const generateFlashcards = async (req, res, next) => {
    try {
        const { documentID, count=10 } = req.body
        const { userAnswers, ...rest } = req.body;
        if(!documentID){
            return res.status(400).json({
                success:false,
                error:'Please provide documentID',
                statusCode:404
            })
        }

        const document = await Document.findOne({
            _id: documentID,
            userID: req.user._id,
            status: 'ready'
        })

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            })
        }

        const cards = await geminiService.generateFlashcards(
            document.extractedText,
            parseInt(count)
        )

        const flashcardSet = await Flashcard.create({
            userID: req.user._id,
            documentID: document._id,
            cards: cards.map(card => ({
                question: card.question,
                answer: card.answer,
                difficulty: card.difficulty,
                reviewCount: 0,
                isStarred: false
            }))
        });
        res.status(201).json({
                success: true,
                data: flashcardSet,
                message: 'Flashcards generated successfully'
        })
    } catch (error){
        next(error)
    }
}


export const generateQuiz = async (req, res, next) => {
    try {
        const { documentID, numQuestions = 5, title} = req.body

        if(!documentID){
            return res.status(400).json({
                success:false,
                error:'Please provide documentID',
                statusCode:400
            })
        }
        const document = await Document.findOne({
                _id:documentID,
                userID:req.user._id,
                status:'ready'
            })
            if(!document){
                return res.status(404).json({
                    success:false,
                    error:'Document not found or not ready',
                    statusCode:404
                })
            }
            
            const questions = await geminiService.generateQuiz(
                document.extractedText,
                parseInt(numQuestions)
            )

            const quiz = await Quiz.create({
                userID:req.user._id, 
                documentID:document._id,
                title: title || `${document.title} - Quiz`,
                questions: questions,
                totalQuestions:questions.length,
                userAnswers: [],
                score: 0
            })
            res.status(201).json({
                success:true,
                data: quiz,
                message: 'Quiz generated successfully'
            })
    } catch (error){
         next(error)
    }
}


export const generateSummary = async (req, res, next) => {
    try {
        const { documentID } = req.body

        if(!documentID){
            return res.status(400).json({
                success:false,
                error:'Please provide documentID',
                statusCode:400
            })
        }
        const document = await Document.findOne({
            _id: documentID,
            userID: req.user._id,
            status: 'ready'
        })

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            })
        }
        
        const summary = await geminiService.generateSummary(document.extractedText)
        res.status(200).json({
            success:true,
            data:{
                documentID:document._id,
                title:document.title,
                summary
            },
            message: 'Summary generated successfully'
        })
    } catch (error){
         next(error)
    }
}


export const chat = async (req, res, next) => {
    try {
        const { documentID, question } = req.body;

        if(!documentID || !question){
            return res.status(400).json({
                success:false,
                error:'Please provide documentID and question',
                statusCode:400
            })
        }

        const document = await Document.findOne({
            _id: documentID,
            userID: req.user._id,
            status: 'ready'
        })

        if(!document){
            return res.status(404).json({
                success:false,
                error:'Document not found or not ready',
                statusCode:404
            })
        }
        
        const releventChunks = findRelevantChunks(document.chunks, question, 3)
        // prefer chunkIndex if present, otherwise fallback to _id
        const chunkIndices = releventChunks.map(c => (c.chunkIndex !== undefined ? c.chunkIndex : c._id));

        let chatHistory = await ChatHistory.findOne({
            userID:req.user._id,
            documentID:document._id,
        })

        if(!chatHistory){
            chatHistory = await ChatHistory.create({
                userID: req.user._id,
                    documentID: document._id,
                messages: []
            })
        }

        const answer = await geminiService.chatWithContext(question, releventChunks);
        // there was an error thats why i added sender path, it will help to identify who sent what in future
            chatHistory.messages.push(
                {
                    sender: 'user',
                    content: question,
                    timestamp: new Date(),
                    releventChunks: []
                },
                {
                    sender: 'assistant',
                    content: answer,
                    timestamp: new Date(),
                    releventChunks: chunkIndices.map(String)
                }
            );

        await chatHistory.save()

        res.status(200).json({
            success:true,
            data:{
                question,
                answer,
                releventChunks: chunkIndices,
                chatHistoryID: chatHistory._id,
            },
            message: 'Response generated successfully'
        });
    } catch (error){
         next(error)
    }
}

export const explainConcept = async (req, res, next) => {
    try {
        const { documentID, concept } = req.body;

        if(!documentID || !concept){
            return res.status(400).json({
                success:false,
                error: 'Please provide documentID and concept',
                statusCode:400
            })
        };

        const document = await Document.findOne({
            _id: documentID,
            userID: req.user._id,
            status:'ready'
        })

        if(!document){
            return res.status(404).json({
                success:false,
                error: 'Document not found or ready',
                statusCode:404
            })
        }

        const releventChunks = findRelevantChunks(document.chunks, concept, 3);
        const context = releventChunks.map(c => c.content).join('\n\n');

        const explaination = await geminiService.explainConcept(concept, context);

        res.status(200).json({
            success:true,
            data: {
                concept,
                explaination,
                releventChunks: releventChunks.map(c => c.chunkIndex)
            },
            message: 'Explanation generated successfully'
        });
    } catch (error){
         next(error)
    }
}


export const getChatHistory = async (req, res, next) => {
    try {
        const { documentID } = req.params;

        if(!documentID){
            return res.status(400).json({
                success:false,
                error: 'Please Provide documentID',
                statusCode:400
            })
        }

        const chatHistory = await ChatHistory.findOne({
            userID: req.user._id,
            documentID: documentID
        }).select('messages') // Only retrieve the messages array

        if(!chatHistory){
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No chat history found for this document'
            })
        }
        res.status(200).json({
            success:true,
            data: chatHistory.messages,
            message: 'Chat history retrieved successfully'

        });
    } catch (error){
         next(error)
    }
}
