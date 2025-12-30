import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
}


export const register = async (req, res, next) => {
    try{
        const { username, email, password } = req.body;
        const userExists= await User.findOne({ $or : [{ email }, { username }] });

        if(userExists){
            return res.status(400).json({
                success: false,
                error:
                userExists.email === email
                ? 'Email is already registered'
                : 'Username is already taken',
                status: 400
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password
        });

        //Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,
                    createdAt: user.createdAt,
                },
                token,
            },
            message: 'User registered successfully'
        })
    }catch(error){
        next(error)
    }
}


export const login = async (req, res, next) => {
    try{

    }catch(error){
        next(error)
    }
}


export const getProfile = async (req, res, next) => {
    try{

    }catch(error){
        next(error)
    }  
}


export const updateProfile = async (req, res, next) => {
    try{

    }catch(error){
        next(error)
    } 
}


export const changePassword = async (req, res, next) => {
    try{

    }catch(error){
        next(error)
    }  
}