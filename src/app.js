
import express, { json } from 'express';
import chalk from 'chalk';
import cors from 'cors';
import router from './routes/index.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(json());
app.use(router);

app.listen(PORT, () => console.log(chalk.bold.green(`--------------- Server running on port ${PORT}`)));


