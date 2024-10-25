import express from 'express'
import passport from 'passport'
import { Strategy as SteamStrategy } from 'passport-steam'
import session from 'express-session';

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: ''
},
    function (identifier, profile, done) {
        console.log(identifier);
        console.log(profile);
        process.nextTick(function () {

            // To keep the example simple, the user's Steam profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Steam account with a user record in your database,
            // and return that user instead.
            profile.identifier = identifier;
            return done(null, profile);
        });

    }
));

const app = express()

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'secret_pls_change',
    resave: true,
    saveUninitialized: true,
}))

app.get('/', (req, res) => {
    res.send('Hello World' + '<br><a href="/auth/steam">login</a>')
})

app.get('/user', (req, res) => {
    const r = {
        message: 'hello',
        discordId: req.session.discordId,
        steamId: req.session.steamId,
        user: req.session.user
    }
    res.json(r)
})

app.get('/auth/steam',
    (req, res, next) => {
        const { id } = req.query
        if (!id) return res.status(400).send()
        req.session.regenerate(() => {
            req.session.discordId = id
            next()
        })
    },
    passport.authenticate('steam', { session: false }),
    function (req, res) {
        // The request will be redirected to Steam for authentication, so
        // this function will not be called.
    }
);

app.get('/auth/steam/return',
    passport.authenticate('steam', { session: false, failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        const user = req.user
        req.session.user = user
        req.session.steamId = user.id
        req.session.save(() => {
            res.redirect('/');
        })
    }
);
app.listen(3000)