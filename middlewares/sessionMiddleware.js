import { v4 as uuidv4 } from 'uuid';

export const sessionMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        req.session.userId = uuidv4();
        req.session.createdAt = new Date();
        req.session.data = {};
    }
    next();
};