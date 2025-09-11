import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import {db} from './utils/dbconnet.js'



import userRouter from './routes/user.routes.js'

dotenv.config()
const app = express()
const port = process.env.PORT || 3000


app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/v1/user',userRouter)

db()

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

