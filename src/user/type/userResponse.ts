import { User } from "../entities/user.entity";

export type UserResponse = Omit<User, 'createdAt' | 'updatedAt' | 'password'>;