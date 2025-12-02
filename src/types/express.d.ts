import { ISanitizedUser } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: ISanitizedUser;
    }
  }
}

export {};