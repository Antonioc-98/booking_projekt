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

    if (result.length != 0) {
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
    }
        user = result[0];
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
    const currentDate = new Date();
    let currentDateSplit = currentDate.toISOString().split('T')[0]
    console.log(currentDateSplit)
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

// Odabir parcele

app.get('/parcele_odabir', (req, res) => {
    let cijenaMin = [];

    const query = `
  SELECT 
  (SELECT MIN(cijena) FROM mb_1 WHERE status = 1) AS table1_cijena,
  (SELECT MIN(cijena) FROM mb_2 WHERE status = 1) AS table2_cijena,
  (SELECT MIN(cijena) FROM mb_3 WHERE status = 1) AS table3_cijena,
  (SELECT MIN(cijena) FROM mb_4 WHERE status = 1) AS table4_cijena,
  (SELECT MIN(cijena) FROM mb_5 WHERE status = 1) AS table5_cijena,
  (SELECT MIN(cijena) FROM mb_6 WHERE status = 1) AS table6_cijena,
  (SELECT MIN(cijena) FROM mb_7 WHERE status = 1) AS table7_cijena,
  (SELECT MIN(cijena) FROM mb_8 WHERE status = 1) AS table8_cijena,
  (SELECT MIN(cijena) FROM mb_9 WHERE status = 1) AS table9_cijena,
  (SELECT MIN(cijena) FROM mb_10 WHERE status = 1) AS table10_cijena
`;



        db.query(query, (error, result) => {
            const tabela = [result[0].table1_cijena, result[0].table2_cijena, result[0].table3_cijena, result[0].table4_cijena, result[0].table5_cijena, result[0].table6_cijena, result[0].table7_cijena, result[0].table8_cijena, result[0].table9_cijena, result[0].table10_cijena];
            for (let i = 0; i < 10; i++) {
                cijenaMin[i] = tabela[i]
            }

            res.render('parcele_odabir.ejs', {
                cMin: cijenaMin,
            });
        });
    
});

app.get('/rezervacija', (req, res) => {
    console.log(req.query.query)
    res.render('rezervacija.ejs', {parcela: req.query.query});
});

// Moje rezervacije

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
const error = req.query.error ? 'Wrong username or password' : null;

    res.render('login.ejs'), { message: error };
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login_invalid', failureMessage: true }),
function(req, res) {
  res.redirect('/');
});

app.get('/login_invalid', (req, res) => {
    res.render('login_invalid.ejs');
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

// Promjena lozinke

app.get('/promijeni_lozinku', (req, res) => {
    res.render('promijeni_lozinku.ejs');
});

app.post('/promijeni_lozinku', (req, res) => {
    let random = Math.floor(Math.random() * 1000000);

    db.query(`SELECT email FROM users WHERE email = '${req.body.email}'`, (error, result) => {
        if (result.length != 0) {
            
            db.query(`UPDATE users SET kod = ${random} WHERE email = '${req.body.email}'`, (error, result) => {
                console.log(result)
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'antonio.praksa@gmail.com',
                      pass: 'koup eyxk yjzz rbur'
                    }
                  });
                  
                  let mailOptions = {
                    from: 'antonio.praksa@gmail.com',
                    to: req.body.email,
                    subject: `Kod`,
                    text: `Kod za promjenu lozinke: ${random}`
                  };
                  
                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });
            
                res.render('promijeni_lozinku_kod.ejs');
            });
        } else {
            res.render('promijeni_lozinku.ejs', {obavijest: 'Email ne postoji!'});
        }
    });
    
    
});

app.get('/promijeni_lozinku_kod', (req, res) => {
    res.render('promijeni_lozinku_kod.ejs');
});

app.post('/promijeni_lozinku_kod', async (req, res) => {
    const lozinka = await bcrypt.hash(req.body.password, 10);
    db.query(`SELECT kod FROM users WHERE email = '${req.body.email}'`, (error, result) => {
        console.log(result[0].kod)
        console.log(Number(req.body.kod))
        if (result[0].kod === Number(req.body.kod)) {
            db.query(`UPDATE users SET lozinkaHashed = '${lozinka}' WHERE email = '${req.body.email}'`, (error, result) => {
                console.log(result)
                res.render('index.ejs');
            });
            
        } else {
            res.render('promijeni_lozinku_kod.ejs', {obavijest: 'Krivi kod, pokušajte ponovno!'});
        }
    });
    
});

// Generiranje datuma

app.get('/generiranje_datuma', (req, res) => {
    res.render('generiranje_datuma.ejs', {});
});

app.post('/generiranje_datuma', (req, res) => {
    let d = 29;
    for (let i = 1; i < 2; i++) {
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

    let tablica = `mb_${req.query.query}`;
    console.log(tablica)
    let datumValue = [];
    let datumId = [];
    let datumCijena = [];
    let datumStatus = [];
    const currentDate = new Date();
    let currentDateSplit = currentDate.toISOString().split('T')[0]
    console.log(currentDateSplit)

// Prikaži datume ne starije od danas.

    db.query(`SELECT id FROM ${tablica} WHERE datum = '${currentDateSplit}'`, (error, result) => {
        datumDanas = result[0].id;
        //console.log(typeof(result[0].id))

//

    db.query(`SELECT datum, id, cijena, status FROM ${tablica} WHERE id > ${datumDanas}`, (error, result) => {  
        
        for (let i = 0; i<result.length; i++) {
        datumValue[i] = (result[i].datum)
        datumId[i] = (result[i].id)
        datumCijena[i] = (result[i].cijena)
        datumStatus[i] = [result[i].status]
        }
        console.log(datumStatus[0][0])
        //console.log(datumValue)
        //console.log(datumId)
        //console.log(datumCijena)
        //console.log(currentDateSplit)
        res.render('mb_1.ejs', {
            dValue: datumValue,
            dId: datumId,
            dCijena: datumCijena,
            dStatus: datumStatus,
            tablicaValue: req.query.query

        });
    });
});
    
});

app.post('/mb_1', loggedIn, (req, res) => {

    let tablica = `mb_${req.query.query}`;
    console.log(tablica)

    let random = Math.floor(Math.random() * 100000000);

    let size = Object.keys(req.body).length;
    console.log(`size: ${size}`)
    console.log('ODABRANI DATUMI')
    console.log(req.body)
    // For object length
    for (const [key, value] of Object.entries(req.body)) {
        db.query(`UPDATE ${tablica} SET status = 0, korisnik_email = '${req.user.email}', parcela_id = ${random} WHERE datum = '${value}'`, (error, result) => {  
            console.log(result)
        });
      }

      
    //Nodemailer

    db.query(`SELECT datum, cijena FROM ${tablica} WHERE parcela_id = ${random}`, (error, result) => {  
        
    let suma;
    let cijenaValue = [];
    let datumValue = [];
    for (let i = 0; i < result.length; i++) {
        datumValue[i] = result[i].datum;
        cijenaValue[i] = result[i].cijena;
    }
    console.log(datumValue)
    console.log(cijenaValue)

    if (Object.entries(req.body).length > 2 && Object.entries(req.body).length < 13) {
    suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);
    suma *= 0.9;
} else if (Object.entries(req.body).length > 13) {
    suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);
    suma *= 0.8;
} else {
    suma = cijenaValue.reduce((partialSum, a) => partialSum + a, 0);
}

db.query(`INSERT INTO računi SET email_korisnik = '${req.user.email}', cijena = ${suma}, id = ${random}`, (error, result) => {  
    console.log(result)
});

console.log(`Suma izračunata ${suma}`)

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
    let datumValue_1 = [];
    let emailValue_1 = [];

    let datumValue_2 = [];
    let emailValue_2 = [];

    let datumValue_3 = [];
    let emailValue_3 = [];

    let datumValue_4 = [];
    let emailValue_4 = [];

    let datumValue_5 = [];
    let emailValue_5 = [];

    let datumValue_6 = [];
    let emailValue_6 = [];

    let datumValue_7 = [];
    let emailValue_7 = [];

    let datumValue_8 = [];
    let emailValue_8 = [];

    let datumValue_9 = [];
    let emailValue_9 = [];

    let datumValue_10 = [];
    let emailValue_10 = [];

    let prihodi = []
    let prihodiSuma;
    db.query(`SELECT cijena FROM računi`, (error, result) => { 
        
    for (let i = 0; i<result.length; i++) {
        prihodi[i] = result[i].cijena;
    }

    prihodiSuma = prihodi.reduce((partialSum, a) => partialSum + a, 0);
    console.log(prihodiSuma)
   

    db.query(`SELECT datum, cijena, korisnik_email FROM mb_1 WHERE status = 0`, (error, result) => { 

        for (let i = 0; i < result.length; i++) {
            datumValue_1[i] = result[i].datum;
            emailValue_1[i] = result[i].korisnik_email;
            
        }

    db.query(`SELECT datum, cijena, korisnik_email FROM mb_2 WHERE status = 0`, (error, result) => {  
        for (let i = 0; i < result.length; i++) {
            datumValue_2[i] = result[i].datum;
            emailValue_2[i] = result[i].korisnik_email;
            
        }

        db.query(`SELECT datum, cijena, korisnik_email FROM mb_3 WHERE status = 0`, (error, result) => {  
            for (let i = 0; i < result.length; i++) {
                datumValue_3[i] = result[i].datum;
                emailValue_3[i] = result[i].korisnik_email;
                
            }

            db.query(`SELECT datum, cijena, korisnik_email FROM mb_4 WHERE status = 0`, (error, result) => {  
                for (let i = 0; i < result.length; i++) {
                    datumValue_4[i] = result[i].datum;
                    emailValue_4[i] = result[i].korisnik_email;
                    
                }
                db.query(`SELECT datum, cijena, korisnik_email FROM mb_5 WHERE status = 0`, (error, result) => {  
                    for (let i = 0; i < result.length; i++) {
                        datumValue_5[i] = result[i].datum;
                        emailValue_5[i] = result[i].korisnik_email;
                        
                    }
                    db.query(`SELECT datum, cijena, korisnik_email FROM mb_6 WHERE status = 0`, (error, result) => {  
                        for (let i = 0; i < result.length; i++) {
                            datumValue_6[i] = result[i].datum;
                            emailValue_6[i] = result[i].korisnik_email;
                            
                        }
                        db.query(`SELECT datum, cijena, korisnik_email FROM mb_7 WHERE status = 0`, (error, result) => {  
                            for (let i = 0; i < result.length; i++) {
                                datumValue_7[i] = result[i].datum;
                                emailValue_7[i] = result[i].korisnik_email;
                                
                            }
                            db.query(`SELECT datum, cijena, korisnik_email FROM mb_8 WHERE status = 0`, (error, result) => {  
                                for (let i = 0; i < result.length; i++) {
                                    datumValue_8[i] = result[i].datum;
                                    emailValue_8[i] = result[i].korisnik_email;
                                    
                                }
                                db.query(`SELECT datum, cijena, korisnik_email FROM mb_9 WHERE status = 0`, (error, result) => {  
                                    for (let i = 0; i < result.length; i++) {
                                        datumValue_9[i] = result[i].datum;
                                        emailValue_9[i] = result[i].korisnik_email;
                                        
                                    }
                                    db.query(`SELECT datum, cijena, korisnik_email FROM mb_10 WHERE status = 0`, (error, result) => {  
                                        for (let i = 0; i < result.length; i++) {
                                            datumValue_10[i] = result[i].datum;
                                            emailValue_10[i] = result[i].korisnik_email;
                                            
                                        }

        res.render('vlasnik.ejs', {
            dValue: datumValue_1,
            eValue: emailValue_1,
            dValue_2: datumValue_2,
            eValue_2: emailValue_2,
            dValue_3: datumValue_3,
            eValue_3: emailValue_3,
            dValue_4: datumValue_4,
            eValue_4: emailValue_4,
            dValue_5: datumValue_5,
            eValue_5: emailValue_5,
            dValue_6: datumValue_6,
            eValue_6: emailValue_6,
            dValue_7: datumValue_7,
            eValue_7: emailValue_7,
            dValue_8: datumValue_8,
            eValue_8: emailValue_8,
            dValue_9: datumValue_9,
            eValue_9: emailValue_9,
            dValue_10: datumValue_10,
            eValue_10: emailValue_10,
            sValue: prihodiSuma
        });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });

    
})
});


// Localhost

app.listen('3000', () => {
    console.log('Server started on port 3000...');
});