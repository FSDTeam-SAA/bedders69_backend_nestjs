import { ZodError } from 'zod';
import { TErrorSource } from '../middlewares/globalErrors.filter';

export function handleZodError(err: ZodError): {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
} {
  const errorSources = err.issues.map((issue) => ({
    path: String(issue.path.at(-1) ?? ''),
    message: issue.message,
  }));
  const specificMessage = errorSources.map((e) => e.message).filter(Boolean).join(', ');
  return {
    statusCode: 400,
    message: specificMessage || 'Validation Error',
    errorSources,
  };
}
