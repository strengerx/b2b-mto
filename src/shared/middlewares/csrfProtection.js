import csurf from 'csurf';
import { NODE_ENV } from '../../config/env.js';

// Use cookie based CSRF tokens
const csrfMiddleware = csurf({
    cookie: {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax'
    }
});

export default csrfMiddleware;
