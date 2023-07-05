import { MongoClient, ObjectId } from 'mongodb';
import express, { json } from 'express';
import chalk from 'chalk';
import cors from 'cors';
import joi from 'joi';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
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
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        console.log(chalk.bold.green(`--------------- Server running on port ${port}`));
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
    const userSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(3).required(),
        name: joi.string().required(),
    });

    const hasError = userSchema.validate(req.body).error;

    if (hasError)
    {
        let errorMessage = 'Campos inválidos';

        if(req.body.password.length < 3) errorMessage = 'Senha deve ter no mínimo 3 caracteres';

        if(req.body.name == undefined || req.body.name.length == 0) errorMessage = 'Campo nome inválido';
        
        if(req.body.email == undefined || req.body.email.length == 0 || !req.body.email.includes('@')) errorMessage = 'Campo email inválido';

        return res.status(422).send({ error: hasError.details, message: errorMessage });
    }

    try {
        const foundUser = await db.collection('users').findOne({ email: req.body.email});

        if (foundUser) return res.status(409).send({message:'Já existe um usuário cadastrado com este e-mail'});
           
        const encryptedPassword = bcrypt.hashSync(req.body.password,10);
    
        await db.collection('users').insertOne({ name: req.body.name, password:encryptedPassword,email:req.body.email});

        return res.sendStatus(201);
        
    } catch (error) {
        return res.status(500).send({ message: 'Internal server error' });
    }
});

app.post('/', async (req, res) => {

    const userSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(3).required()
    });

    const hasError = userSchema.validate(req.body).error;

    if (hasError) return res.status(422).send({ error: hasError.details, message: 'Campos inseridos inválidos' });

    try {
        const foundUser = await db.collection('users').findOne({ email: req.body.email });

        if (foundUser) {
            if (bcrypt.compareSync(req.body.password, foundUser.password)) {
                const generatedToken = uuidv4();

                await db.collection('sessions').insertOne({ user: foundUser.name, token: generatedToken });

                const obj = {
                    token: generatedToken,
                    name: foundUser.name
                }

                return res.status(200).send(obj);
            }

            return res.status(401).send({message: 'Senha incorreta'});
        }
        else
        {
            return res.status(404).send({message:'Usuário não encontrado'});
        }
    } catch (error) {
        return res.status(500).send({ message: 'Internal server error' });
    }
});

app.post('/nova-transacao/:tipo', async (req, res) => {
    const token = req.headers.token;
});

// ---------------- GET ---------------
app.get('/home', async (req, res) => {
    const token = req.headers.token;


    if (!token) return res.sendStatus(401);

});

// -------- BONUS ------------

app.delete('/deletar-registro/:tipo', async (req, res) => {
    const token = req.headers.token;


    if (!token) return res.sendStatus(401);

});

app.put('/editar-registro/:tipo', async (req, res) => {
    const token = req.headers.token;


    if (!token) return res.sendStatus(401);

});

