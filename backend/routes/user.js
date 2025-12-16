const express = require('express');
const router = express.Router();
const {User} = require('../db');
const {Account} = require('../db');
const jwt = require('jsonwebtoken')
const zod = require('zod');
const {authMiddleware} = require('../middleware');

const {JWT_SECRET} = require('../config')

const signupSchema = zod.object({
    username : zod.string(),
    password : zod.string(),
    firstname : zod.string(),
    lastname : zod.string(),
})

const updateBody = zod.object({
    password : zod.string().optional(),
    firstname : zod.string().optional(),
    lastname : zod.string().optional(),
})


router.post('/signup',async (req,res)=>{  
    const {success} = signupSchema.safeParse(req.body);
    const {username,password,firstname,lastname}= req.body;
     if(!success)
        return res.status(400).send("Username already taken or incorrect")

     const findUser = await User.findOne({username:req.body.username});
     if(findUser)
        return res.status(400).send("Username already taken or incorrect")

    const newUser = new User({username,password,firstname,lastname});
    await newUser.save();

    const userId = newUser._id;
    console.log(userId);
    

    await Account.create({
        userId,
        balance : 1 + Math.random() * 10000
    })

    const token = jwt.sign({userId},JWT_SECRET);
    
    res.json({
        message :"User created successfully",
        token
    })
})

const signinBody = zod.object({
    username : zod.string(),
    password : zod.string(),
})

router.post('/signin',async (req,res)=>{

    const {success} = signinBody.safeParse(req.body);
    if(!success){
        return res.json({
        message :"Couldn't signin"
    })
   } 

    try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
     
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
})

router.put('/', authMiddleware, async (req,res)=>{
    const {success} = updateBody.safeParse(req.body);
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }
    
    await User.updateOne({username:req.user.username},req.body)
    res.json({
        message: "User updated successfully"
    })

    
})



router.get('/bulk',async (req,res)=>{
    const filter = req.query.filter || '';

    const users = await User.find({
        $or:[{
            firstName :{
                $regex : filter
            }
           },
            {
                lastName : {
                    $regex : filter
                }
            }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })

})

module.exports = router;