import { MongoClient,ObjectId } from 'mongodb';
import express, { json } from 'express';
import chalk from 'chalk';
import cors from 'cors';
import joi from 'joi';
import dotenv from 'dotenv';
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);
const app = express();

// const messageSchema = joi.object({
//     to: joi.string().required(),
//     text: joi.string().required(),
//     type: joi.string().valid('message', 'private_message').required(),
// });

start();

async function start() {

    app.use(cors());
    app.use(json());

    app.listen(process.env.PORT, () => {
        console.log(chalk.bold.green(`--------------- Server running on port ${process.env.PORT}`));
    });

    try {
        await mongoClient.connect();
        console.log(chalk.bold.blue('--------------- MongoDB Connected!'));
    } catch (err) {
        console.log(chalk.bold.red(err.message));
    }
}

const db = mongoClient.db();

// ---------------- POST ---------------

app.post('/cadastro', async (req, res) => {

});

app.post('/', async (req, res) => {

    let token = '';

    res.status(200).send(token);
});

app.post('/nova-transacao/:tipo', async (req, res) => {
    const token = req.headers.token;
});

// ---------------- GET ---------------
app.get('/home', async (req, res) => {
    const token = req.headers.token;


    if(!token) return res.sendStatus(401);

});

// -------- BONUS ------------

app.delete('/deletar-registro/:tipo', async (req, res) => {
    const token = req.headers.token;


    if(!token) return res.sendStatus(401);

});

app.put('/editar-registro/:tipo', async (req, res) => {
    const token = req.headers.token;


    if(!token) return res.sendStatus(401);

});

