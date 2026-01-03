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
        const { email, password } = req.body;

        // Validate input 
        if(!email || !password){
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
                statusCode: 400
            });
        }

        // check for user
        const user = await User.findOne({ email }).select('+password');

        if(!user){
            return  res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Check Password
        const isMatch = await user.matchPassword(password);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials',
                statusCode: 401
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            token,
            message: 'Login successful'
        });
    }catch(error){
        next(error)
    }
}


export const getProfile = async (req, res, next) => {
    try{
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        })
    }catch(error){
        next(error)
    }  
}


export const updateProfile = async (req, res, next) => {
    try{
        const { username, email, profileImage } = req.body;

        const user = await User.findById(req.user._id);  

        if(username) user.username = username;
        if(email) user.email =  email;
        if(profileImage) user.profileImage = profileImage;

        await user.save();
        
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage,
            },
            message: 'Profile updated successfully'
        });
    }catch(error){
        next(error)
    } 
}


export const changePassword = async (req, res, next) => {
    try{
        const { currPassword, newPassword } = req.body;

        if(!currPassword || !newPassword){
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password',
                statusCode: 400
            });
        }


        const user = await User.findById(req.user._id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(currPassword);

        if(!isMatch){
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
                statusCode: 401
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    }catch(error){
        next(error)
    }  
}