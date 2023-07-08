import { db } from '../database/database.connection.js';

export async function getTransactions (req, res) {
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
};