const express = require('express')
const app = express()
const port = process.env.PORT || 3001
const bodyParser = require("body-parser")
const cors = require("cors")
const firebase = require("firebase/app")
const jwt = require("jsonwebtoken")
require("dotenv").config()
require("firebase/firestore")
require("firebase/auth")


var whitelist = ['https://sight-of-youth.vercel.app',process.env.TEST_URL]

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}



//app.use(cors(corsOptionDelegate))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://sight-of-youth.vercel.app/"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.use(bodyParser.json())

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

firebase.default.initializeApp(firebaseConfig)



app.get("/allblogs",(req,res)=> {
  const blogs = firebase.default.firestore().collection("blogs")
  
  // blogs.onSnapshot(querySnapshot => {
  //   querySnapshot.forEach(x => {

  //     res.json(x.data())
  //   })
    
  // })


  blogs.get().then(item => {
    const items = item.docs.map(doc => ({id : doc.id,...doc.data()}))

    res.json(items)
  })
})

app.post("/allblogs",(req,res)=> {
  const blogs = firebase.default.firestore().collection("blogs")

  blogs
    .doc(req.body.id.toString())
    .set(req.body)
    .then(() => res.json(req.body))
    .catch(err => res.sendStatus(404).send(err))
})

app.post("/allblogs/:id/addComment",(req,res)=> {
  const blogs = firebase.default.firestore().collection("blogs")

  blogs
    .doc(req.params.id)
    // .get()
    // .then((item) => res.json(item.data()))
  

    .update({
      comments : firebase.default.firestore.FieldValue.arrayUnion(req.body) 
    })
    .then(()=> res.json(req.body))
    .catch(err => res.sendStatus(404).send(err))

})

app.post("/allblogs/:id/likePost",(req,res) => {
  const blogs = firebase.default.firestore().collection("blogs")

  if(req.body.likeType === 1){
    blogs
    .doc(req.params.id.toString())
    .update({
      amountOfLikes : firebase.default.firestore.FieldValue.increment(1),
      likedProfiles : firebase.default.firestore.FieldValue.arrayUnion(req.body.profileId)
    })
    .then(() => res.json(req.body))
    .catch(err => res.sendStatus(404).send(err) )
  }
  if(req.body.likeType === -1){
    blogs
    .doc(req.params.id.toString())
    .update({
      amountOfLikes : firebase.default.firestore.FieldValue.increment(-1),
      likedProfiles : firebase.default.firestore.FieldValue.arrayRemove(req.body.profileId)
    })
    .then(() => res.json(req.body))
    .catch(err => res.sendStatus(404).send(err) )
  }

  // console.log(req.body)
  // res.sendStatus(200)
  

})

app.post("/allblogs/:id/updateBlog",(req,res)=> {
  const blogs = firebase.default.firestore().collection("blogs")

  blogs
    .doc(req.params.id)
    // .get()
    // .then((item) => res.json(item.data()))
  

    .set(req.body)
    .then(()=> res.json(req.body))
    .catch(err => res.sendStatus(404).send(err))

})

app.post("/addUser",(req,res) => {
  const users = firebase.default.firestore().collection("users")

  users
    .where("email","==",req.body.email)
    .get()
    .then(item => {
      if(item) res.sendStatus(404).send("There has already an account in this email ")
    })

  users
    .add({
      ...req.body,
      role : "costumer"
    })
    .then(() => res.json(req.body))
    .catch(err => res.sendStatus(404).send(err))  
})

app.get("/login",authToken,(req,res) => {
  const users = firebase.default.firestore().collection("users")

  
  users
  .where("email","==",req.user.email)
  .get()
  .then(item => {
    if(!item) res.sendStatus(404)
    
    const items = item.docs.map(doc => ({id : doc.id,...doc.data()}))[0]

    if(jwt.verify(items.password,process.env.AUTH_JWT_TOKEN).password !== req.user.password) res.sendStatus(401)
    
    res.send({name : items.name , avatar : items.avatar , id : items.id,role : items.role  })

  })
  
  
})

function authToken(req,res,next){
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.AUTH_JWT_TOKEN , (err,user) => {
    if (err) return res.sendStatus(404)
    req.user = user
    next()
  })
  
}

app.listen(port, () => console.log(`Example app listening on port port!`))

