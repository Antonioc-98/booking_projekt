const passport = require('passport');
const LocalStrategy = require('passport-local');

passport.use(
    new LocalStrategy({usernameField: 'email'}, (username, password) => {
        try{
        db.query(`SELECT email FROM users WHERE email = '${username}'`, (error, result) => {
            if (error) throw error;
            if(result != username) {
                console.log('Email pronadjen');
            } 
            if (result.length = 0) {
                console.log("Email nije pronadjen")
                throw new Error('Korisnik sa emailom nije pronadjen')
            }
        }); 
        } catch (err) {

        }

    })
)
//https://www.youtube.com/watch?v=_lZUq39FGv0 8.29