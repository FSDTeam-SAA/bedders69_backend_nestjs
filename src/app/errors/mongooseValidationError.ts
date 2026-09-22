import { Error as MongooseError } from 'mongoose';
import { TErrorSource } from '../middlewares/globalErrors.filter';

export function handleMongooseValidationError(
  err: MongooseError.ValidationError,
): {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
} {
  const errorSources = Object.values(err.errors).map((e) => ({
    path: e.path,
    message: e.message,
  }));
  const specificMessage = errorSources.map((e) => e.message).filter(Boolean).join(', ');
  return {
    statusCode: 400,
    message: specificMessage || 'Validation Error',
    errorSources,
  };
}
