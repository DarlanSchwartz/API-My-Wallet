import joi from 'joi';

export const newTransactionSchema = joi.object({
    value: joi.number().positive().required(),
    description: joi.string().required(),
    date: joi.string().required(),
});

export  const editTransactionSchema = joi.object({
    value: joi.number().positive().required(),
    description: joi.string().required(),
});