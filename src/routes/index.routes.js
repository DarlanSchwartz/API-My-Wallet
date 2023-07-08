import { Router } from "express";
import accountRouter from "./account.routes.js";
import mainRouter from "./main.routes.js";
import transactionRouter from "./transactions.routes.js";

const router = Router();

router.use(accountRouter);
router.use(mainRouter);
router.use(transactionRouter);

export default router;