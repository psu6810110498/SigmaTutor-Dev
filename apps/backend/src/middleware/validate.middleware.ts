import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

/**
 * Middleware to validate request data against a Zod schema.
 * @param schema - Zod schema to validate against
 * @param target - 'body' (default) for POST/PUT, 'query' for GET endpoints
 */
export const validate = (schema: ZodSchema, target: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = target === 'query' ? req.query : req.body;
      const parsed = schema.parse(data);
      // Write parsed (coerced) values back so routes receive proper types.
      // For query: use Object.assign to avoid overwriting the getter-only property.
      if (target === 'query') {
        Object.assign(req.query, parsed);
      } else {
        req.body = parsed;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
