const express = require('express');
const app = express();
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local');


// Create connection

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nodemysql',
    port: 3306
});

// Connect database

db.connect((err) => {
    if (err) {
        console.log('Error on connection');
    };
    console.log('MySql connected...');
});

const sessionStore = new MySQLStore({}/* session store options */, db);

app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'abcd',
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
    cookie: {
        maxAge: 60000 * 10,
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport login

passport.use(new LocalStrategy({usernameField: 'email'}, function verify(username, password, done) {
    db.query(`SELECT email FROM users WHERE email = '${username}'`, (error, result) => {
    console.log('Provjera login')  
    if (error) { return done(error); }
      if (result.length === 0) { 
        console.log('Incorrect username or password.')
        return done(null, false, {
        message: 'Incorrect username or password.' }); 
        }
        user = result[0];
        console.log(user.email)
      return done(null, user);
    });
  }));

passport.serializeUser(function(user, done) {
    console.log(`Serialized: ${user}`)
    console.log(`Serialized user id: ${user.id}`)
    done(null, user.email); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    db.query(`SELECT email FROM users WHERE email = '${user.email}'`, (error, result) => {
        //console.log(`Deserialized: ${result[0]}`)
        //console.log(user.email)
        done(error, user);
    });
});

//https://www.youtube.com/watch?v=_lZUq39FGv0 8.29

//https://www.youtube.com/watch?v=TDe7DRYK8vU
//https://www.youtube.com/watch?v=oExWh86IgHA
app.get('/', (req, res) => {
    console.log(req.session)
    console.log(req.session.id)
    res.render('index.ejs', {proba: 'Radi'});
});

app.get('/login', (req, res) => {
    console.log(req.session)
    console.log(req.session.id)
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.render('index.ejs');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/register_status', (req, res) => {
    res.render('register_status.ejs');
});

//Provjera

app.post('/register', async (req, res) => {
    req.session.isAuth = true;

    const lozinka = await bcrypt.hash(req.body.password, 10);

    let user = {
        ime: req.body.first_name, 
        prezime: req.body.last_name, 
        email: req.body.email, 
        lozinkaHashed: req.body.password
    }
    let registerStatus = ''
    
    db.query(`SELECT email FROM users WHERE email = '${req.body.email}'`, (error, result) => {
        if (error) throw error;
        if(result.length != 0) {
            console.log('Duplikat!');
            registerStatus = 'E-mail je već iskorišten za registraciju. Upišite novi email ili se pokušajte prijaviti.'
            console.log(result[0].email)
        } else {
            console.log('Provjera = nema duplikata')
            registerStatus = 'Registracija uspješna';
            let sql = 'INSERT INTO users SET ?';
            db.query(sql, user, (error, result) => {
                if (error) throw error;
                console.log(result);     
            });
        };
        res.render('register_status.ejs', {resolved: registerStatus});
    });
});



app.listen('3000', () => {
    console.log('Server started on port 3000...');
});