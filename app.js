var express = require('express'),
    bodyParser = require('body-parser'),
    Membership = require('membership'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    mysql = require('mysql'),
    assert = require('assert'),
    flash = require('connect-flash');

var app = express();
var membership;

connection = mysql.createConnection({host: "localhost", user: "kysiek", password: "passs", database: "BlaBlaPaczka"}, function (err, result) {
    assert(err == null, "Could not connect to the Database");
    console.log("Connected successfully to the database");
});
connection.connect(function (err) {
    assert(err == null, "Could not connect to the Database");
    console.log("Connected successfully to the database");
    membership = new Membership(connection);
});


var port = process.env.PORT || 3000;

passport.use(new LocalStrategy({
        usernameField: 'phoneNumber',
        passwordField: 'password'
    },
    function(username, password, done) {
        console.log("Szukanie użytkownika: " + username + " " + password);
        membership.authenticate(username, password, function (err, authResult) {
            if(authResult.success) {
                done(null, authResult.user);
            } else {
                done(null, false, {message: authResult.message});
            }
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.authenticationToken);
});
passport.deserializeUser(function (token, done) {
    membership.findUserByToken(token, done);
});


app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({
    secret: 'keyboard cat',
    proxy: true,
    resave: true,
    saveUninitialized: true }));
app.use(cookieParser('double secret probation'));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var userRouter = express.Router();
var parcelRouter = express.Router();

userRouter.route('/register')
    .post(function (req, res) {
        console.log("There was a request to register");
        var bodyArgs = req.body;
        membership.register(bodyArgs.username, bodyArgs.password, bodyArgs.confirm, bodyArgs.phoneNumber, function (err, result) {
            var code = result.code || 200;
            delete result.code;
            res.status(code).json(result);
        });
    });

userRouter.route('/login')
    .post(function (req,res,next) {

        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.json({success: false, message: info.message}); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.json({success: true, message: "Successfully logged"});
            });
        })(req, res, next);
    })
    .get(function(req, res){
        res.json({ user: req.user, message: req.user});
    });

userRouter.route('/logout')
    .get(function(req, res){
        req.logout();
        res.status().json({success: true, message: "Successfully logout"})
    });

userRouter.route('/account')
    .get(ensureAuthenticated, function(req, res){
        res.status(200).json({ user: req.user });
    });

parcelRouter.route('/Parcels')
    .get(function (req, res) {
        var responseJson = {res: 'This is my api'};

        res.json(responseJson);
    });

app.use('/api', parcelRouter);
app.use('/users', userRouter);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).json({message: "You are not logged"});
}

app.listen(port, function () {
    console.log('Running on PORT: ' + port);
});