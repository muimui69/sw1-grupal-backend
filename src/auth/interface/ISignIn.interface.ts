import { User } from "src/user/entity";


export interface ISignInResponse{
  token: string;
  user: User
}