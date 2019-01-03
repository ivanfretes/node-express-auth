const express = require('express')
const session = require('express-session')
const app = express()

const bodyParser = require('body-parser')

//const RedisStore = require('connect-redis')(session);

const CINCO_MIMUTOS = 1000 * 60 * 5 // 5 Minutos

const {
    PORT = 3000,
    NODE_ENV = 'development',
    SESS_NAME = 'sid',
    SESS_LIFETIME = CINCO_MIMUTOS,
    SESS_SECRET = 'ssh!quiet,it\'asecret!',
} = process.env

const IS_PRODUCCION = NODE_ENV === 'production'

// -- express app configurations --

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(session({
    //store : new RedisStore(), todo : vinculate database
    name : SESS_NAME,
    resave : false,
    saveUninitialized : false,
    secret : SESS_SECRET,
    cookie : {
        maxAge : SESS_LIFETIME, 
        sameSite: true,
        secure : IS_PRODUCCION,
    }
}))

app.use((req, res, next)=> {
    const { userId } = req.session 
    if (userId){
        res.locals.user = users.find((user) => { user.id === req.session.userId})
    }

    next()
})

const redirectLogin = (req, res, next) => {
    if (!req.session.userId){
        res.redirect('/login')
    } else {
        next()
    }
}

const redirectHome = (req, res, next) => {
    if (req.session.userId){
        res.redirect('/home')
    } else {
        next()
    }
}

// todo : db
const users = [
    {id : 1, name : 'Alex', email : 'alex@gmail.com', password : 'secret'},
    {id : 2, name : 'Max', email : 'max@gmail.com', password : 'secret'},
    {id : 3, name : 'Hagard', email : 'hagard@gmail.com', password : 'secret'}
]


app.get('/',(req, res) => {
    
    const { userId } = req.session

    console.log(userId)
    res.send(`
        <h1>Welcome</h1>
        ${userId ? `
            <a href="/home">Home</a>
            <form method="post" action="/logout">
                <button type="submit">Salir</button>
            </form>` :
        `
            <a href="/login">Login</a>
            <a href="/register">Register</a>
        ` } 
    `)
})

app.get('/home', redirectLogin,  (req, res) => {
    const { user } = res.locals
    
    res.send(`
        <h1>Home</h1>
        <ul>
            <li>Nombre: ${ user.name } </li>
            <li>Email : ${ user.email }</li>
        </ul>
    `)
})


app.get('/login', redirectHome ,(req, res) => {
    res.send(`
        <h1>Login</h1>
        <form action="/login" method="post">

            <label for="email">Email</label>
            <input type="email" name="email" required><br>

            <label for="password">Password</label>
            <input type="password" name="password">


            <button type="submit">Send Login</button>
        </form>
    `)

    
})


app.get('/register', redirectHome , (req, res) => {
    res.send(`
        <h1>Register</h1>

        <form action="/login" method="post">
            <label for="name">Name</label>
            <input type="text" name="name" required><br>

            <label for="email">Email</label>
            <input type="email" name="email" required><br>

            <label for="password">Password</label>
            <input type="password" name="password">


            <button type="submit">Send Register</button>
        </form>
    `)
})

app.post('/login', redirectHome, (req, res) => {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);
    
    if (email && password){
        const user = users.find( (user) => { // TODO hash
            if (user.email === email && user.password === password) {
                return user
            }
            return false
        })

        if (user){
            req.session.userId = user.id
            return res.redirect('/home')
        }
    }
    
    return res.redirect('/login')
    
})


app.post('/register', redirectHome, (req, res) => {
    const { name , email, password } = req.body;

    if (name && email && password){ // todo: valifdation     
        const exists = users.some((user) => {
            user.email === email
        })

        if (!exists){
            const user = {
                id : users.length + 1,
                name, 
                email, 
                password
            }
            
            users.push(user)

            req.session.userId = user.id
            res.redirect('/home')
        }
    }
    res.redirect('/register') // todo: view errors
})

app.post('/logout', redirectLogin ,(req,res) => {
    req.session.destroy(err => {
        if (err){
            res.redirect('/home')
        }
        
        res.clearCookie(SESS_NAME)
        res.redirect('/login')
    })

})

app.listen(PORT, ()=> {
    console.log('http://localhost:' + PORT)
})
