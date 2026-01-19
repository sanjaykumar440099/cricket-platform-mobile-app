import { UserRole } from './roles.model';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}
