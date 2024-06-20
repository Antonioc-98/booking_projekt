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
        console.log('Error on connection')
    }
    console.log('MySql connected...')
})

app.get('/', (req, res) => {
    res.render('index.ejs', {proba: 'Radi'})
})

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', (req, res) => {
    let user = {ime: req.body.name, email: req.body.email, lozinka: req.body.password};
    console.log(user);
    res.send(`Registracija uspješna ${req.body.name} ${req.body.email} ${req.body.password}`);
})



app.listen('3000', () => {
    console.log('Server started on port 3000...')
})