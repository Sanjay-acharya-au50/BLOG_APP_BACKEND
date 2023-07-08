const express = require("express");
const cors = require("cors");
require('./db/db')
const User = require("./model/UserSchema")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer  = require('multer')
const upload = multer({ dest: './uploads/' })
// fs = file system
const fs = require("fs");
const Post = require("./model/PostSchema");


const app = express();

app.use(cors({
    origin:"https://sanjay-blog-app-website.onrender.com",
    // origin:"http://localhost:5173",
    credentials:true,
}))

// middlware
app.use(express.json());
app.use(cookieParser())

app.use('/uploads', express.static(__dirname+'/uploads'))

// register 
app.post("/register", async (req,res)=>{
    const {name, email, password} = req.body;

    if(!name, !email || !password){
       return res.status(400).json("empty fields")
    }
    const isExist = await User.findOne({email});
    if(isExist){
           return res.status(401).json("email already exist!")
    }
    else{
                const salt = await bcrypt.genSalt(10);
                const hashedPass = await bcrypt.hash(password, salt);
                // res.json(hashedPass)
                const user = await User.create({name,email,password:hashedPass});
                res.status(200).json(user);
    }


})

app.post("/login", async (req,res)=>{
    // res.json(req.body)
    const {email, password} = req.body;
    if(!email || !password){
        res.status(401).json("empty fields")
    }
    try {
        const isExist = await User.findOne({email});
        // console.log("user",isExist)
        if(!isExist){
            res.status(410).json("Email id is not register")
        }
        else{

            const validCred = await bcrypt.compare(password, isExist.password)
            if(validCred){
                // console.log("login Suc")
                const jwtSign = jwt.sign({id:isExist._id, email:isExist.email, name:isExist.name},"sec")
                // console.log("jwtSign:",jwtSign)
                res.cookie("jwtSign", jwtSign ,
                // for localhost comment here
                {
                    sameSite: 'none',
                    secure: true,
                }
                )
                return res.status(210).json({id:isExist._id, email:isExist.email, name:isExist.name})

            }else{
                return res.status(410).json("Wrong Credentials")
            }
        }

    } catch (error) {
        console.log("hello from login error")
        // res.json("wrong cred")
    }

})

// const cookieParser = require("cookie-parser");
app.get("/home", async (req,res)=>{
    // res.json(req.cookies)
    const {jwtSign} = req.cookies;
    // console.log("88 : cooki",req.cookies)
    // console.log("89: login token : ",token)
    try {
        if(jwtSign){
            const jwtVerify = await jwt.verify(jwtSign , "sec");

            console.log("login verify tok",jwtVerify)
            res.status(200).json(jwtVerify);
        }
    } catch (error) {
        res.status(410).json("jwt error")
    }
    // res.json("works")
   
}
)

app.post("/logout", async (req,res)=>{
    // const {token} = req.cookies;
    // console.log("token:",token);
      res.clearCookie("jwtSign", {
        secure:true,
        sameSite:'none',
        expires:new Date(0)
      }).json("logout suc")

})


app.post("/post", upload.single("files"), async (req,res)=>{
  
        const {originalname, path} = req.file;
        const {title, sumamry, quill} = req.body;
        console.log("req body",req.body)
        console.log("110 titel, sum:",title,sumamry,quill)
       
        console.log(originalname)
        const part = originalname.split(".");
        // console.log(part)
        const ext = part[part.length-1]
        // console.log(ext)
        const img = path+"."+ext;
        // console.log(img)
        // saving image with extension in uploads
        fs.renameSync(path,path+"."+ext)


    const {jwtSign} = req.cookies;
    console.log("tok",jwtSign)
    try {
        const jwtVerify = await jwt.verify(jwtSign , "sec");
        console.log("kwt veryfy",jwtVerify)
        const postDoc = await Post.create({
            img,
            title,
            sumamry,
            quill,
            author:jwtVerify.id
        })
        res.json(postDoc)
        console.log(postDoc)

        // console.log("143", jwtVerify)
    } catch (error) {
        res.status(410).json("140 jwt error")
    }

   
})

app.get("/post", async (req,res)=>{
    // error
    const data = await Post.find().populate('author', ['email']).sort({createdAt : -1}).limit(20)
    // const data = await Post.find()
    res.json(data)
    // console.log(data);
})

app.get('/post/:id', async (req,res)=>{
    const {id} = req.params
    const postDoc = await Post.findById(id).populate('author')
    res.json(postDoc)
})

app.put("/edit/:id", upload.single("files"), async (req,res)=>{
    // console.log("req",req.file)
    if(req.file){
        const {originalname, path} = req.file;
        var img = null;
        const part = originalname.split(".");
        console.log("p",part)
        const ext = part[part.length-1]
        console.log("ext",ext);
        img = path+"."+ext;
        console.log("imgt",img)

        fs.renameSync(path,img)
    }
    console.log("img",img)
   
// console.log("rq body",req.body)
const {title, sumamry, quill,id} = req.body;
// console.log(":destruc:",title, sumamry, quill,id)
    const {jwtSign} = req.cookies;
    // console.log("token:", jwtSign)
    try {
        const jwtVerify = await jwt.verify(jwtSign , "sec");
        // console.log("kwt veryfy",jwtVerify)
        const postDoc = await Post.findById(id);
        // console.log(postDoc,"174")
        // console.log("truFAll",JSON.stringify(jwtVerify.id) === JSON.stringify(postDoc.author))
        const validUser = JSON.stringify(jwtVerify.id) === JSON.stringify(postDoc.author)
        // console.log("v",validUser)
        
        if(validUser){
            const postDocUpdate = await postDoc.updateOne({
            img : img ? img : postDoc.img,
            title,
            sumamry,
            quill,
        })
        res.json(postDocUpdate)
        console.log("postDoc",postDocUpdate)

        }
        
        // console.log("143", jwtVerify)
    } catch (error) {
        res.status(410).json("jwt error")
    }


})

app.get("/",(req,res)=>{
    res.send("test working")
})




const PORT =  5000;
app.listen(PORT, ()=>{
    console.log(`server listening on port -> ${PORT}`)
})