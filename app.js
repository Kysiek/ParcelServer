var express = require('express'),
    bodyParser = require('body-parser'),
    Membership = require('membership'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var app = express();
var membership = new Membership("membership");

var port = process.env.PORT || 3000;

passport.use(new LocalStrategy(
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

var userRouter = express.Router();
var parcelRouter = express.Router();

userRouter.route('/register')
    .post(function (req, res) {
        console.log("There was a request to register");
        var bodyArgs = req.body;
        membership.register(bodyArgs.username, bodyArgs.email, bodyArgs.password, bodyArgs.confirm, bodyArgs.phone, function (err, result) {
            res.json(result);
        });
    });

userRouter.route('/login')
    .post(passport.authenticate('local', { failureRedirect: '/login'}), function(req, res) { res.json("success"); })
    .get(function(req, res){
        res.json({ user: req.user, message: req.user});
    });

userRouter.route('/logout')
    .get(function(req, res){
        req.logout();
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