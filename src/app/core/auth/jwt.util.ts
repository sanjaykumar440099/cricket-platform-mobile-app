import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  sub: string;              // userId
  role: 'admin' | 'scorer' | 'viewer';
  exp: number;
  iat: number;
}

export function decodeJwt(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token);
}
