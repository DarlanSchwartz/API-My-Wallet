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

    const hasError = userSchema.validate(req.body, { abortEarly: false }).error;

    if (hasError) {
        let errorMessage = '';

        if (req.body.password.length < 3) errorMessage += 'Senha deve ter no mínimo 3 caracteres';

        if (req.body.name == undefined || req.body.name.length == 0) errorMessage += '\nCampo nome inválido';

        if (req.body.email == undefined || req.body.email.length == 0 || !req.body.email.includes('@')) errorMessage += '\nCampo email inválido';

        return res.status(422).send({ error: hasError.details, message: errorMessage });
    }

    try {
        const foundUser = await db.collection('users').findOne({ email: req.body.email });

        if (foundUser) return res.status(409).send({ message: 'Já existe um usuário cadastrado com este e-mail' });

        const encryptedPassword = bcrypt.hashSync(req.body.password, 10);

        await db.collection('users').insertOne({ name: req.body.name, password: encryptedPassword, email: req.body.email, balance: 0, transactions: [] });

        return res.sendStatus(201);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ message: 'Internal server error' });
    }
});

app.post('/', async (req, res) => {

    const userSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(3).required()
    });

    const hasError = userSchema.validate(req.body, { abortEarly: false }).error;

    if (hasError) return res.status(422).send({ error: hasError.details, message: 'Campos inseridos inválidos' });

    try {
        const foundUser = await db.collection('users').findOne({ email: req.body.email });

        if (foundUser) {
            if (bcrypt.compareSync(req.body.password, foundUser.password)) {
                const generatedToken = uuidv4();

                await db.collection('sessions').insertOne({ email: foundUser.email, token: generatedToken });

                const obj = {
                    token: generatedToken,
                    name: foundUser.name,
                    balance: foundUser.balance,
                    transactions: foundUser.transactions
                }

                return res.status(200).send(obj);
            }

            return res.status(401).send({ message: 'Senha incorreta' });
        }
        else {
            return res.status(404).send({ message: 'Usuário não encontrado' });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ message: 'Internal server error' });
    }
});

app.post('/nova-transacao/:tipo', async (req, res) => {
    const token = req.headers.authorization;
    if (!token || token == '') return res.sendStatus(401);

    const transactionSchema = joi.object({
        value: joi.number().positive().required(),
        description: joi.string().required(),
        date: joi.string().required(),
    });

    const hasError = transactionSchema.validate(req.body, { abortEarly: false }).error;

    if (hasError) {
        let errorMessage = '';

        if (isNaN(Number(req.body.value))) errorMessage = 'Valor não pode ser uma string em uma transação';

        if (!isNaN(Number(req.body.value) && Number(req.body.value) < 0)) errorMessage += '\nValor não pode ser negativo em uma transação';

        if (req.body.description == undefined || req.body.description.length == 0) errorMessage += '\nDescrição da transação não pode estar vazia';

        if (req.body.date == undefined || req.body.date.length == 0 || req.body.date == '') errorMessage += '\nData inválida';

        return res.status(422).send({ error: hasError.details, message: errorMessage });
    }

    try {
        const foundUser = await db.collection('sessions').findOne({ token: token.replace('Bearer ', '') });

        if (!foundUser) return res.status(401).send({ message: 'Usuário não está logado!' });

        const userInfo = await db.collection('users').findOne({ email: foundUser.email });

        const balanceValue = req.params.tipo == 'entrada' ? Number(userInfo.balance) + Number(req.body.value) : Number(userInfo.balance) - Number(req.body.value);
        await db.collection('users').updateOne({ email: foundUser.email }, { $set: { transactions: [...userInfo.transactions, { ...req.body, type: req.params.tipo, id: uuidv4() }], balance: balanceValue } });

        return res.sendStatus(201);

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ message: 'Internal server error' });
    }

});

// ---------------- GET ---------------
app.get('/home', async (req, res) => {
    const token = req.headers.authorization;

    if (!token || token == '') return res.sendStatus(401);

    try {
        const foundUser = await db.collection('sessions').findOne({ token: token.replace('Bearer ', '') });
        if (!foundUser) return res.status(401).send({ message: 'Usuário não está logado!' });

        const userInfo = await db.collection('users').findOne({ email: foundUser.email });
        if (!userInfo) return res.status(401).send({ message: 'Usuário não existe!' });

        return res.status(200).send({ transactions: userInfo.transactions, balance: userInfo.balance, username: userInfo.name });

    } catch (error) {
        console.log(error.message);
        return res.status(500).send({ message: 'Internal server error' });
    }
});

// -------- BONUS ------------

app.delete('/deletar-registro/:id', async (req, res) => {
    const token = req.headers.authorization;
    const id = req.params.id;

    if (!token || !id) return res.sendStatus(401);

    try {
        const foundUser = await db.collection('sessions').findOne({ token: token.replace('Bearer ', '') });
        if (!foundUser) return res.status(401).send({ message: 'Usuário não está logado!' });

        const userInfo = await db.collection('users').findOne({ email: foundUser.email });
        if (!userInfo) return res.status(401).send({ message: 'Usuário não existe!' });

        const newTransactions = userInfo.transactions.filter(transaction => transaction.id !== id);
        let newBalance = 0;

        newTransactions.forEach(trans => {
            if (trans.type == 'entrada') {
                newBalance += Number(trans.value);
            }
            else {
                newBalance -= Number(trans.value);
            }
        });

        await db.collection('users').updateOne({ email: foundUser.email }, { $set: { transactions: newTransactions, balance: newBalance } });

        return res.status(202).send({ transactions: newTransactions, balance: newBalance });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: 'Internal server error' });
    }
});

app.put('/editar-registro/:id', async (req, res) => {

    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    const id = req.params.id;
    if(!id || id == '') return res.status(404).send('É necessário um id para editar uma transação!');

    const {value,description} = req.body;

    const editTransactionSchema = joi.object({
        value: joi.number().positive().required(),
        description: joi.string().required(),
    });

    const hasError = editTransactionSchema.validate(req.body, { abortEarly: false }).error;

    if (hasError) {
        let errorMessage = '';

        if (isNaN(Number(value))) errorMessage = 'Valor não pode ser uma string em uma transação';

        if (!isNaN(Number(value) && Number(value) < 0)) errorMessage += '\nValor não pode ser negativo em uma transação';

        if (description == undefined || description.length == 0) errorMessage += '\nDescrição da transação não pode estar vazia';

        return res.status(422).send({ error: hasError.details, message: errorMessage});
    }
    
    try {
        const foundUser = await db.collection('sessions').findOne({ token: token.replace('Bearer ', '') });
        if (!foundUser) return res.status(401).send({ message: 'Usuário não está logado!' });

        const userInfo = await db.collection('users').findOne({ email: foundUser.email });
        if (!userInfo) return res.status(401).send({ message: 'Usuário não existe!' });        

        let updatedTransaction = userInfo.transactions.find(tr => tr.id == id);
        updatedTransaction.value = value;
        updatedTransaction.description = description;

        let newBalance = 0;

        userInfo.transactions.forEach(trans => {
            if (trans.type == 'entrada') {
                newBalance += Number(trans.value);
            }
            else {
                newBalance -= Number(trans.value);
            }
        });

        await db.collection('users').updateOne({ email: foundUser.email }, { $set: { transactions: userInfo.transactions, balance: newBalance } });

        return res.status(202).send({ transactions: userInfo.transactions, balance: newBalance});

    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: 'Internal server error' });
    }
});

