const express = require('express');


const userRouter = require('../src/routes/userRoutes');
const taskRoutes = require('../src/routes/taskRoutes');

const app = express();
const bodyParser = require('body-parser');

const port = process.env.PORT;

// app.use((req, res, next) => {

//     return res.status(500).send('site under maintenance')
// })

app.use(bodyParser.json())

app.use(userRouter);
app.use(taskRoutes);






app.listen(port, () => {
    console.log('musa server is up and running')
})
