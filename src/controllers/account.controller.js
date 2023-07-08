import { db } from '../database/database.connection.js';
import joi from 'joi';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { signInSchema, signUpSchema } from '../schemas/account.schemas.js';

export async function signUp (req, res) {

    const hasError = signUpSchema.validate(req.body, { abortEarly: false }).error;

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
};

export async function signIn (req, res) {

    const hasError = signInSchema.validate(req.body, { abortEarly: false }).error;

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
};