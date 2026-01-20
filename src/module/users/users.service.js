import { BaseService } from '../../shared/services/BaseService.js';
import { User } from './users.model.js';

export const userService = new BaseService(User, {
    searchFields: ['name', 'email'],
    softDelete: true,
    defaultSort: '-createdAt'
});
