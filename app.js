const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path')
const mysql = require('mysql');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs')
const passport = require('passport')
const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');


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
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: 'abcd',
    saveUninitialized: false,
    resave: false,
    store: sessionStore,
    cookie: {
        maxAge: 60000 * 100,
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport login

// Function to hash a password using bcrypt
async function hashPassword(password) {
    const saltRounds = 10; // Number of salt rounds
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err; // Re-throw error to handle it outside the function
    }
}

passport.use(new LocalStrategy({usernameField: 'email'}, function verify(username, password, done) {

    

    db.query(`SELECT email, lozinkaHashed FROM users WHERE email = '${username}'`, (error, result) => {
    console.log('Provjera login')  

    let hash_compare = bcrypt.compareSync(password, result[0].lozinkaHashed);
    console.log(hash_compare)

    if (error) { return done(error); }
      if (result.length === 0) { 
        console.log('Incorrect username or password.')
        return done(null, false, {
        message: 'Incorrect username or password.' }); 
        } else if (hash_compare != true) {
            console.log('Incorrect Password.')
            return done(null, false, {
            message: 'Incorrect username or password.' }); 
        };
        user = result[0];
        console.log(user.email)
      return done(null, user);
    });
  }));

// Serialize user

passport.serializeUser(function(user, done) {
    console.log(`Serialized: ${user}`)
    console.log(`Serialized user id: ${user.id}`)
    done(null, user.email); 
});

// Deserialize user

passport.deserializeUser(function(id, done) {
    db.query(`SELECT email FROM users WHERE email = '${user.email}'`, (error, result) => {
        //console.log(`Deserialized: ${result[0]}`)
        //console.log(user.email)
        done(error, user);
    });
});

// Check if logged in middleware

function loggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect('/login_false');
    }
}

function loggedInA(req, res, next) {
    if (req.user) {
        if (req.user.email === 'kamp.admin@adriatic.com') {
        next();
    }
    } else {
        res.redirect('/login_false');
    }
}

function loggedInV(req, res, next) {
    if (req.user) {
        if (req.user.email === 'kamp.vlasnik@adriatic.com') {
        next();
    }
    } else {
        res.redirect('/login_false');
    }
}

//https://www.youtube.com/watch?v=_lZUq39FGv0 8.29

//https://www.youtube.com/watch?v=TDe7DRYK8vU
//https://www.youtube.com/watch?v=oExWh86IgHA

//Slike za kamp
//https://secure.phobs.net/book.php?page=cross_selling&companyid=956&hotelid=5761&checkin=2024-07-29&checkout=2024-07-30&ibelang=hr&unitid=27783&crcid=62d973b617cb21b6ad74eb1248fb4ac7&eccode=eyJjaGVja19hZ2Fpbl9ub3RlIjp0cnVlfQ%253D%253D

app.get('/', (req, res) => {
    let emailVlasnik = '';
    if (req.user) {
        emailVlasnik = req.user.email;
    };
    res.render('index.ejs', {
        proba: 'Radi',
        loginEmail: req.session.passport,
        loginEmailVlasnik: emailVlasnik
    });
});

app.get('/kontakt', (req, res) => {
    res.render('kontakt.ejs');
});


// Moje rezervacije

app.get('/rezervacija', (req, res) => {
    res.render('rezervacija.ejs');
});

app.get('/moje_rezervacije', loggedIn, (req, res) => {
    let rezerviraniDatumi = [];
    let parcela = [];

    db.query(`SELECT datum, parcela_id FROM mb_1 WHERE korisnik_email = '${req.user.email}' UNION SELECT datum, parcela_id FROM mb_2 WHERE korisnik_email = '${req.user.email}'`, (error, result) => {  
        console.log(result);
        for (let i = 0; i<result.length; i++) {
            rezerviraniDatumi[i] = result[i].datum;
            parcela[i] = result[i].parcela_id;
            }
            console.log(rezerviraniDatumi)

        res.render('moje_rezervacije.ejs', {
            datumiValue: rezerviraniDatumi,
            parcelaValue: parcela
        });
    });
    
});

//


app.get('/login', (req, res) => {
    console.log(req.session)
    console.log(req.session.id)
    console.log(req.session.passport)
    if (req.user) {
    console.log(req.user.email)
}

    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local'), (req, res) => {
    res.redirect('/');
});

// Passport logout

app.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

//

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/login_test', loggedIn, (req, res) => {
    res.render('login_test.ejs');
});

app.get('/login_false', (req, res) => {
    res.render('login_false.ejs');
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
        lozinkaHashed: lozinka
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

app.get('/promijeni_lozinku', (req, res) => {
    res.render('promijeni_lozinku.ejs');
});

app.post('/promijeni_lozinku', (req, res) => {
    res.render('login.ejs');
});

// Generiranje datuma

app.get('/generiranje_datuma', (req, res) => {
    res.render('generiranje_datuma.ejs', {});
});

app.post('/generiranje_datuma', (req, res) => {
    let d = 0;
    for (let i = 0; i < 30; i++) {
        d++;
        console.log(d)
        let datumGen = `2024-09-${d}`;

        let user = {
            datum: datumGen, 
            status: 1, 
            cijena: 40,
        };

        let sql = 'INSERT INTO mb_2 SET ?';
        db.query(sql, user, (error, result) => {
            if (error) throw error;
            console.log(result);     
        });
    };

    res.render('odabir.ejs', {});
    
});

// Prikaz i odabir slobodnih datuma za rezervaciju

app.get('/odabir', (req, res) => {
    res.render('odabir.ejs', {});
});

// mb_1

app.get('/mb_1', loggedIn, (req, res) => {

    let datumValue = [];
    let datumId = [];
    let datumCijena = [];
    const currentDate = new Date();
    currentDateSplit = currentDate.toISOString().split('T')[0]

// Prikaži datume ne starije od danas.

    db.query(`SELECT id FROM mb_1 WHERE datum = '${currentDateSplit}'`, (error, result) => {
        datumDanas = result[0].id;
        //console.log(typeof(result[0].id))

//

    db.query(`SELECT datum, id, cijena FROM mb_1 WHERE status = 1 AND id > ${datumDanas}`, (error, result) => {  
        
        for (let i = 0; i<result.length; i++) {
        datumValue[i] = (result[i].datum)
        datumId[i] = (result[i].id)
        datumCijena[i] = (result[i].cijena)
        }
        //console.log(result)
        //console.log(datumValue)
        //console.log(datumId)
        //console.log(datumCijena)
        //console.log(currentDateSplit)
        res.render('mb_1.ejs', {
            dValue: datumValue,
            dId: datumId,
            dCijena: datumCijena

        });
    });
});
    
});

app.post('/mb_1', loggedIn, (req, res) => {

    let random = Math.floor(Math.random() * 100000000);

    let size = Object.keys(req.body).length;
    console.log(`size: ${size}`)
    // For object length
    for (const [key, value] of Object.entries(req.body)) {
        db.query(`UPDATE mb_1 SET status = 0, korisnik_email = '${req.user.email}' WHERE datum = '${value}'`, (error, result) => {  
            console.log(result)
        });
      }

    //Nodemailer

    db.query(`SELECT datum, cijena FROM mb_1 WHERE korisnik_email = '${req.user.email}'`, (error, result) => {  
        
    let cijenaValue = [];
    let datumValue = [];
    for (let i = 0; i < result.length; i++) {
        datumValue[i] = result[i].datum;
        cijenaValue[i] = result[i].cijena;
    }

    const suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'antonio.praksa@gmail.com',
          pass: 'koup eyxk yjzz rbur'
        }
      });
      
      let mailOptions = {
        from: 'antonio.praksa@gmail.com',
        to: req.user.email,
        subject: `Rezervacija broj ${random}`,
        text: `Uspješno ste rezervirali za datume ${datumValue}. Ukupna cijena ${suma} EUR. Ugodan boravak želi vam Kamp Adriatic!`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    });
    //
      
    res.render('odabir.ejs', {});
});

// mb_2

app.get('/mb_2', loggedIn, (req, res) => {

    let datumValue = [];
    let datumId = [];
    let datumCijena = [];
    const currentDate = new Date();
    currentDateSplit = currentDate.toISOString().split('T')[0]

// Prikaži datume ne starije od danas.

    db.query(`SELECT id FROM mb_2 WHERE datum = '${currentDateSplit}'`, (error, result) => {
        datumDanas = result[0].id;
        //console.log(typeof(result[0].id))

    db.query(`SELECT datum, id, cijena FROM mb_2 WHERE status = 1 AND id > ${datumDanas}`, (error, result) => {  
        
        for (let i = 0; i<result.length; i++) {
        datumValue[i] = (result[i].datum)
        datumId[i] = (result[i].id)
        datumCijena[i] = (result[i].cijena)
        }
        //console.log(result)
        //console.log(datumValue)
        //console.log(datumId)
        //console.log(datumCijena)
        //console.log(currentDateSplit)
        res.render('mb_2.ejs', {
            dValue: datumValue,
            dId: datumId,
            dCijena: datumCijena

        });
    });
});
    
});

app.post('/mb_2', loggedIn, (req, res) => {

    let random = Math.floor(Math.random() * 100000000);

    let size = Object.keys(req.body).length;
    console.log(`size: ${size}`)
    // For object length
    for (const [key, value] of Object.entries(req.body)) {
        db.query(`UPDATE mb_2 SET status = 0, korisnik_email = '${req.user.email}' WHERE datum = '${value}'`, (error, result) => {  
            console.log(result)
        });
      }

    //Nodemailer

    db.query(`SELECT datum, cijena FROM mb_2 WHERE korisnik_email = '${req.user.email}'`, (error, result) => {  
        
        let cijenaValue = [];
        let datumValue = [];
        for (let i = 0; i < result.length; i++) {
            datumValue[i] = result[i].datum;
            cijenaValue[i] = result[i].cijena;
        }
    
        const suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);
    
          let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'antonio.praksa@gmail.com',
              pass: 'koup eyxk yjzz rbur'
            }
          });
          
          let mailOptions = {
            from: 'antonio.praksa@gmail.com',
            to: req.user.email,
            subject: `Rezervacija broj ${random}`,
            text: `Uspješno ste rezervirali za datume ${datumValue}. Ukupna cijena ${suma} EUR. Ugodan boravak želi vam Kamp Adriatic!`
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        });
        //

    res.render('odabir.ejs', {});
});

// Admin

app.get('/admin', loggedInA, (req, res) => {
    res.render('admin.ejs');
});

app.get('/cijena_admin', loggedInA, (req, res) => {
    res.render('cijena_admin.ejs');
});

app.post('/cijena_admin', loggedInA, (req, res) => {
    let mbParcela = `mb_${req.body.parcela}`
    let state = '';

    db.query(`UPDATE ${mbParcela} SET cijena = ${req.body.cijena} WHERE datum = '${req.body.datum}'`, (error, result) => {  
        console.log(result)
        if (result) {
            state = 'Cijena uspješno promijenjena!'
        } else {
            state = 'Greška, pokušajte ponovno!'
        }
        res.render('cijena_admin.ejs', {stateDisplay: state});
    });
});

app.get('/rezerviraj_admin', loggedInA, (req, res) => {
    res.render('rezerviraj_admin.ejs');
});

app.post('/rezerviraj_admin', loggedInA, (req, res) => {
    let mbParcela = `mb_${req.body.parcela}`
    let state = '';
    console.log(req.body.datum);
    console.log(req.body.email);

    db.query(`UPDATE ${mbParcela} SET korisnik_email = '${req.body.email}', status = 0 WHERE datum = '${req.body.datum}'`, (error, result) => {  
        console.log(result)
        if (result) {
            state = 'Datum uspješno rezerviran!'
        } else {
            state = 'Greška, pokušajte ponovno!'
        }
        res.render('rezerviraj_admin.ejs', {stateDisplay: state});
    });
});

app.get('/otkazivanje_admin', loggedInA, (req, res) => {
    res.render('otkazivanje_admin.ejs');
});

app.post('/otkazivanje_admin', loggedInA, (req, res) => {
    let mbParcela = `mb_${req.body.parcela}`
    let state = '';
    let deleteEmail = '';
    let emailK = '';
    console.log(req.body.datum);
    console.log(req.body.email);

    db.query(`SELECT korisnik_email FROM ${mbParcela} WHERE datum = '${req.body.datum}'`, (error, result) => {  
        emailK = result[0].korisnik_email
   

    db.query(`UPDATE ${mbParcela} SET korisnik_email = '${deleteEmail}', status = 1 WHERE datum = '${req.body.datum}'`, (error, result) => {  
        console.log(result)
        if (result) {
            state = 'Datum uspješno otkazan!'
        } else {
            state = 'Greška, pokušajte ponovno!'
        }

        
        let user = {
            korisnik_email: emailK,
            opis: req.body.razlog
        };

        let sql = 'INSERT INTO otkazivanje SET ?';
        db.query(sql, user, (error, result) => {
            if (error) throw error;
            console.log(result);     
        });
        res.render('otkazivanje_admin.ejs', {stateDisplay: state});
    });
});
});

// Vlasnik

app.get('/vlasnik', loggedInV, (req, res) => {
    let datumValue = [];
    let cijenaValue = [];
    let emailValue = [];
    db.query(`SELECT datum, cijena, korisnik_email FROM mb_1 WHERE status = 0`, (error, result) => {  
        for (let i = 0; i < result.length; i++) {
            datumValue[i] = result[i].datum;
            cijenaValue[i] = result[i].cijena;
            emailValue[i] = result[i].korisnik_email;
        }
        const suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);

        let datumValue_2 = [];
    let cijenaValue_2 = [];
    let emailValue_2 = [];

    db.query(`SELECT datum, cijena, korisnik_email FROM mb_2 WHERE status = 0`, (error, result) => {  
        for (let i = 0; i < result.length; i++) {
            datumValue_2[i] = result[i].datum;
            cijenaValue_2[i] = result[i].cijena;
            emailValue_2[i] = result[i].korisnik_email;
        }
        const suma_2 = cijenaValue_2.reduce((partialSum, a) => partialSum + a, 0);

        res.render('vlasnik.ejs', {
            dValue: datumValue,
            cValue: cijenaValue,
            eValue: emailValue,
            sum: suma,
            dValue_2: datumValue_2,
            cValue_2: cijenaValue_2,
            eValue_2: emailValue_2,
            sum_2: suma_2
        });
    });
    });

    
    
});


// Localhost

app.listen('3000', () => {
    console.log('Server started on port 3000...');
});