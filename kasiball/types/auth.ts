export type UserRole = 'ADMIN' | 'MANAGER' | 'REFEREE' | 'PLAYER';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};
