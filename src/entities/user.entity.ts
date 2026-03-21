export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  wallet_address?: string;
  is_client: boolean;
  is_developer: boolean;
  profile_picture_url?: string;
  bio?: string;
  is_verified: boolean;
  token_balance: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  wallet_address?: string;
  is_client?: boolean;
  is_developer?: boolean;
  profile_picture_url?: string;
  bio?: string;
}

export interface UpdateUserDto {
  full_name?: string;
  wallet_address?: string;
  profile_picture_url?: string;
  bio?: string;
  is_verified?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  wallet_address?: string;
  is_client: boolean;
  is_developer: boolean;
  profile_picture_url?: string;
  bio?: string;
  is_verified: boolean;
  token_balance: number;
  created_at: string;
}
