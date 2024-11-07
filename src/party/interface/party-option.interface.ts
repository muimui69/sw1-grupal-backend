import { RootFilterQuery } from "mongoose";
import { Party } from "../entity";

export interface IPartyOptions {
    filter?: RootFilterQuery<Party>;
    skip?: number;
    limit?: number;
}
