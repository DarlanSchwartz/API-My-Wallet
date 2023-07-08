import { getTransactions } from '../controllers/main.controller.js';
import { Router } from "express";

const mainRouter = Router();

mainRouter.get('/home', getTransactions);

export default mainRouter;