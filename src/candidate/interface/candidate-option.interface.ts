import { RootFilterQuery } from "mongoose";
import { Candidate } from "../entity";


export interface ICandidateOptions {
  filter?: RootFilterQuery<Candidate>;
  skip?: number;
  limit?: number;
}