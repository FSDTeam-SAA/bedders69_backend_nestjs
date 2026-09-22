import { MongoError } from 'mongodb';
import { TErrorSource } from '../middlewares/globalErrors.filter';

export function handleDuplicateKeyError(
  err: MongoError & { keyValue?: Record<string, unknown> },
): {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
} {
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : '';
  const value = err.keyValue ? String(Object.values(err.keyValue)[0]) : '';
  const message = field
    ? `'${value}' already exists for field '${field}'`
    : 'Duplicate Entry';
  return {
    statusCode: 409,
    message,
    errorSources: [
      {
        path: field,
        message,
      },
    ],
  };
}
