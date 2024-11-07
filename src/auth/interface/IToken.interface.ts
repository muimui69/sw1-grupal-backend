export interface AuthTokenResult {
  userId:   string;
  iat:      number;
  exp:      number;
}

export interface IUseToken {
  userId:     string;
  isExpired:  boolean
}