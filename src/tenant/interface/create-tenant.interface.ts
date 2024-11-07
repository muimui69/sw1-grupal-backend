import { Plan } from "src/constant";


export interface ICreateTenant{
  name:         string;
  subdomain:    string;
  logoUrl?:     string; 
  plan:         Plan;
  limit_voting: number;
}