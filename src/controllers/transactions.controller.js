
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/database.connection.js';
import { editTransactionSchema, newTransactionSchema } from '../schemas/transactions.schemas.js';

export async function newTransaction (req, res) {
    const token = req.headers.authorization;
    if (!token || token == '') return res.sendStatus(401);

    const hasError = newTransactionSchema.validate(req.body, { abortEarly: false }).error;

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
}

export async function deleteRegistry (req, res) {
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
};

export async function editTransaction (req, res) {

    const token = req.headers.authorization;
    if (!token) return res.sendStatus(401);

    const {id, tipo} = req.params;
    if(!id || id == '') return res.status(404).send('É necessário um id para editar uma transação!');

    const {value,description} = req.body;

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
};