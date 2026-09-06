import { JwtPayload } from '../app/middlewares/auth.guard';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
