const express = require('express');
const app = express();
const mysql = require('mysql');


app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

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

app.get('/', (req, res) => {
    res.render('index.ejs', {proba: 'Radi'});
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/register_status', (req, res) => {
    res.render('register_status.ejs');
});

//Provjera

app.post('/register', (req, res) => {

    let user = {ime: req.body.first_name, prezime: req.body.last_name, email: req.body.email, lozinkaHashed: req.body.password}
    let registerStatus = ''

    db.query(`SELECT email FROM users WHERE email = '${req.body.email}'`, (error, result) => {
        if (error) throw error;
        if(result.length != 0) {
            console.log('Duplikat!');
            registerStatus = 'E-mail je već iskorišten za registraciju. Upišite novi email ili se pokušajte prijaviti.'
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