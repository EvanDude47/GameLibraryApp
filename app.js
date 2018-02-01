var http = require('http');
var path = require('path');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var session = require('express-session');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');

//var entries = [];

//app.locals.entries = entries;

app.use(logger("dev"));

app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(session({
    secret:"secretSession",
    resave:true,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
    done(null, user);
});

passport.deserializeUser(function(user, done){
    done(null, user);
});

LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
    userNameField:'',
    passwordField:''
},

function(username, password, done){
    var user = {
        username: username,
        password: password
    };
    done(null, user)
}));

app.get("/", function(req, res){
    MongoClient.connect(url, function(err, db){
        if(err) throw err;
        var dbObj = db.db("games");

        dbObj.collection("games").find().toArray(function(err, results){
            console.log("Site served");
            db.close();
            res.render("index", {games:results});
        });
    });
});

app.get("/new-entry", function(req, res){
    res.render("new-entry");
});

app.get("/sign-in", function(req, res){
    res.render("sign-in");
});

app.get("/sign-up", function(req, res){
    res.render("sign-up");
});

app.get('/profile', function(req, res){
        res.json(req.user);
});

app.post("/new-entry", function(req, res){
    if(!req.body.title||!req.body.body){
        res.status(400).send("Entries must have valid text");
        return;
    }
    //connected to database and saved games
    MongoClient.connect(url, function(err, db){
        if(err) throw err;

        var dbObj = db.db("games");

        dbObj.collection("games").save(req.body, function(err, result){
            console.log("Data saved");
            db.close();
            res.redirect("/");
        });
    });

    //entries.push({
    //    title:req.body.title,
    //    body:req.body.body,
    //    published:new Date()
    //});
    //res.redirect("/");
});

app.post("/sign-up", function(req, res){
    console.log(req.body);

    MongoClient.connect(url, function(err, db){
        if(err) throw err;

        var dbObj = db.db("users");
        
        var user = {
            username: req.body.username,
            password: req.body.password
        }
        
        dbObj.collection("users").insert(user, function(err, results){
            if(err) throw err;

            req.login(req.body, function(){
                res.redirect('/profile');
            });
        });
    });
});

app.post("/sign-in", passport.authenticate('local', {
        failureRedirect:'/sign-in'
    }),

    function(req, res){
        res.redirect("/profile");
    }
);

app.use(function(req, res){
    res.status(404).render("404");
});

http.createServer(app).listen(3000, function(){
    console.log("Game library server started on port 3000");
});