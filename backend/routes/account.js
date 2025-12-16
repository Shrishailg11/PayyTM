const express = require('express');

const router = express.Router();
const { Account } = require('../db');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');

router.get('/balance', authMiddleware, async (req,res)=>{
      try {  
        const userAccount = await Account.findOne({userId : req.userId});
        
        if(!userAccount)
            return res.status(400).json({
        message : "User not found"
        })
        return res.json({
            balance : userAccount.balance
        })
        
      } catch (error) {
         res.json({
            message:"Something went wrong"
         })
      }
})

//This is bad because it does not follow either full or no property, if a transaction fails in between it leaves database in inconsistent state.


// router.post('/transfer', authMiddleware,async(req,res)=>{
//     const toAccount = req.body.toAccount;
//     const amount = req.body.amount;

//     const fromAccount = Account.findOne({userId : req.userId});

//     if(!toAccount || !fromAccount)
//         return res.status(400).json({
//             message : "User not found"
//         })

//     if(fromAccount.balance < amount)
//        return res.status(400).json({
//       mesaage :" Insufficient balance"
//     })

//     await Account.updateOne({
//         userId : req.userId
//     },{
//         $inc :{
//             balance : -amount
//         }
//     })

//     await Account.updateOne({
//         userId : toAccount
//     }, {
//         $inc :{
//             balance : amount
//         }
//     })

//     res.json({
//         message : "Transfer successful"
//     })
    
// })

//good way using sessions


router.post('/transfer',authMiddleware, async(req,res)=>{
    const session = await mongoose.startSession();
    session.startTransaction();

    const to = req.body.toAccount;
    const amount = req.body.amount;
    console.log(req.userId);
    

    const fromAccount = await Account.findOne({userId:req.userId}).session(session);
    console.log(fromAccount);
    

    if(!fromAccount  || fromAccount.balance < amount)
    {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message : "Something went wrong" //account or balance
        })
    }

    const toAccount = await Account.findOne({userId:to}).session(session);
    
    if(!toAccount)
    {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
            message:"Invalid account to send the money"
        })
    }

    //Transform of money

    await Account.updateOne({userId:req.userId},
        {
            $inc :{
                balance : -amount
            }
        }
    ).session(session);

    await Account.updateOne({
        userId:to},
        {
            $inc :{
                balance : amount
            }
        }
    )


    //commit the transcation
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
        message : "Transfer successful"
    })
})

module.exports = router;