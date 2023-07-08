import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

const mongoClient = new MongoClient(process.env.DATABASE_URL);

try {
    await mongoClient.connect();
    console.log(chalk.bold.blue('--------------- MongoDB Connected!'));
} catch (err) {
    console.log(chalk.bold.red(err.message));
}

export const db = mongoClient.db();