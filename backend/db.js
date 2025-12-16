const mongoose = require('mongoose');

// vNBIJCsnzUNW9YB9

mongoose.connect("mongodb+srv://shrishailg116_db_user:vNBIJCsnzUNW9YB9@cluster0.khcxrlx.mongodb.net/?appName=Trial").then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log("Error connecting to MongoDB",err);
});

const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    firstName : String,
    lastname : String
})

const User = mongoose.model("User",userSchema);


const accountSchema = new mongoose.Schema({
    userId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    balance : {
        type : Number,
        default : 0,
        required : true
    }
})

const Account = mongoose.model("Account",accountSchema);


module.exports = {
    User,
    Account
}