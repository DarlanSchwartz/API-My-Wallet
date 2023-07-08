import { Router } from "express";
import { deleteRegistry, editTransaction, newTransaction } from '../controllers/transactions.controller.js';

const transactionRouter = Router();

transactionRouter.post('/nova-transacao/:tipo', newTransaction );
transactionRouter.delete('/deletar-registro/:id',deleteRegistry);
transactionRouter.put('/editar-registro/:tipo/:id', editTransaction);

export default transactionRouter;