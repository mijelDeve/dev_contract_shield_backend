export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  walletAddress?: string;
  isClient: boolean;
  isDeveloper: boolean;
  profilePictureUrl?: string;
  bio?: string;
  isVerified: boolean;
  tokenBalance: number;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  isDeveloper: boolean;
  iat?: number;
  exp?: number;
}
