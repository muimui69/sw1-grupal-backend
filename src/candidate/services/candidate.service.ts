import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {v4 as uuid} from "uuid"

import { Candidate } from '../entity';
import { ICandidateOptions } from '../interface';
import { CreateCandidateDto } from '../dto/create-candidate.dto';

@Injectable()
export class CandidateService {
  constructor(
    @InjectModel(Candidate.name) private candidate: Model<Candidate>
  ){}

  public async findAllCandidate(query:ICandidateOptions): Promise<Candidate[]> {
    const {filter, skip = 0, limit = 10} = query;
    const findAll = await this.candidate.find(filter)
    .skip(skip)
    .limit(limit)
    .exec()
    return findAll;
  }
  public async countCandidates(query: ICandidateOptions): Promise<number>{
    const find = await this.candidate.countDocuments(query.filter);
    return find;
  }
  public async createCandidate(tenant_id: string, createCandidateDto: CreateCandidateDto): Promise<Candidate> {
    console.log(createCandidateDto);
    const findCandidate = await this.findAllCandidate({
      filter: {
        $and: [
          {
            tenant_id,
          },
          {
            name: createCandidateDto.name
          }
        ]
      }
    });
    if(findCandidate.length)
      throw new BadRequestException("Candidato ya registrado")

    const createCandidate = await this.candidate.create({
      name: createCandidateDto.name,
      tenant_id,
      photo: uuid()+"."+createCandidateDto.photo.extension
    })
    return createCandidate;
  }
}
