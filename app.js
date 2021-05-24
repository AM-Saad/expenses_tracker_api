const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
var cors = require('cors')

let app = express();



const MONGODBURI = `mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
    }@onlineshop-zsiuv.mongodb.net/${process.env.DATABASE_URL}`;


const store = new MongoDBStore({
    uri: MONGODBURI,
    collection: "sessions"
});


app.use(cors()) // Use this after the variable declaration


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));



app.set('view engine', 'ejs');
app.set('views', 'views');


const authRoutes = require("./routes/auth");
const cardsRoutes = require("./routes/card");
// const publicRoutes = require("./routes/public");

const billsRoutes = require('./routes/bill');
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "application/json, Content-Type, Authorization, X-PINGOTHER, multipart/form-data"
    );
    next();
});


app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));


// app.use((req, res, next) => {
//     next()
// })

// app.use(publicRoutes);

app.use('/admin', billsRoutes);
app.use('/cards', cardsRoutes);
app.use(authRoutes);





mongoose.connect(MONGODBURI).then(result => { app.listen(process.env.PORT || 3000) }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
});
