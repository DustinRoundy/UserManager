const express = require('express');
// const firebase = require('firebase');
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');

let app = express();
// firebase.initializeApp({
//     apiKey: "AIzaSyBitPWkBLUF38RNsFq0G7e3QvpBR8QshAI",
//     authDomain: "users-a9617.firebaseapp.com",
//     databaseURL: "https://users-a9617.firebaseio.com",
//     projectId: "users-a9617",
//     storageBucket: "",
//     messagingSenderId: "629673296097"
//
// });
// let db = firebase.firestore();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(session({
    secret: 'supersecretkey',
    saveUninitialized: false,
    cookie: {maxAge:600000},
}));

app.use(require('express-session')({
    secret: 'some random strings',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

//add user to session
passport.serializeUser(function(user, done) {
    done(null, user)
});
//after Logout take user out from session
passport.deserializeUser(function(user, done) {
    done(null, user);
});

class User{
    constructor(first, last, email, password){
        this.first = first;
        this.last = last;
        this.email = email;
        this.password = password;
    }
    validatePassword(password){
        return this.password === password;
    }
}
class Users{
    constructor(){
        this.users = [];
    }
    addOne(user){
        this.users.push(user);
    }
    findOne(email, callback){
        let find = false;
        this.users.forEach((user, index) => {
            if(user.email === email){
                find = user;
            }
        });
        callback(null, find);
    }
    delete(email){
        let find = false;
        this.users.forEach((user, index) => {
            if(user.email === email){
                this.users.splice(index, 1);
            }
        });
    }
}

let users = new Users();
let admin = new User('Admin', 'Root', 'admin@admin', '123');
users.addOne(admin);

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        session: false,
    },
    (email, password, done) => {
        users.findOne(email, (err, user) => {
            if (err) {return done(err);}
            if(!user){
                return done(null, false, {message: 'Incorrect Email'});
            }
            if(!user.validatePassword(password)){
                return done(null, false, {message: 'Incorrect Password'});
            }
            return done(null, user);
        })
    }
));

app.get('/', (req, res)=>{
   //  let usersarry = [];
   // db.collection('users').get().then((query)=>{
   //     query.forEach((doc) => {
   //         usersarry.push({id: doc.id, data: doc.data()});
   //         console.log(doc.data());
   //     });
   //     console.log(usersarry);
   //     res.render('index', {users: usersarry});
   // });
    let errormessage = req.flash('error');
    console.log(errormessage);
    let message = req.flash('message');
    res.render('index', {errormessage: errormessage});

});

app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/userlist',
        failureRedirect: '/',
        failureFlash: true
    })
);

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
app.get('/userlist', isLoggedIn, (req, res)=>{ //  here you send the file to the
    res.render('userlist', {users: users.users});
});

app.get('/edit/:id', isLoggedIn, (req, res)=>{
   // res.send('edit user' + req.params.id);
   users.findOne(req.params.id, (err, user) => {
       res.render('edit', {user: user});
   })
});

app.post('/edit/:id', isLoggedIn, (req,res) => {
    users.findOne(req.params.id, (err, user) => {
        user.email = req.body.email;
        user.first = req.body.first;
        user.last = req.body.last;
        user.email = req.body.email;
        user.password = req.body.password;
    });
    res.redirect('/userlist');
});

app.get('/adduser', isLoggedIn, (req, res)=>{
    res.render('adduser');
});

app.post('/adduser', isLoggedIn, (req,res) => {
    let user = new User();
    user.first = req.body.first;
    user.last = req.body.last;
    user.email = req.body.email;
    user.password = req.body.password;
    users.addOne(user);
    res.redirect('/userlist');
});

app.get('/delete/:id', (req,res) => {
    users.delete(req.params.id);
    res.redirect('/userlist');
});

app.listen(3000, ()=>{
    console.log('listening on 3000');
});