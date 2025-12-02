import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

const validate = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validationSchema = Joi.object({
      body: schema.body || Joi.object({}),
      query: schema.query || Joi.object({}),
      params: schema.params || Joi.object({}),
    });

    const { error, value } = validationSchema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      throw ApiError.badRequest('Validation failed', errors);
    }

    // Replace with validated values
    req.body = value.body;
    req.query = value.query;
    req.params = value.params;

    next();
  };
};

export default validate;