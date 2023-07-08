import { Router } from "express";
import { signIn, signUp } from "../controllers/account.controller.js";

const accountRouter = Router();

accountRouter.post('/cadastro', signUp );
accountRouter.post('/', signIn);

export default accountRouter;