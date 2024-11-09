export interface ElectionABI {
    _format: string;
    contractName: string;
    sourceName: string;
    abi: ABI[];
    bytecode: string;
    deployedBytecode: string;
    linkReferences: DeployedLinkReferences;
    deployedLinkReferences: DeployedLinkReferences;
    factoryDeps: DeployedLinkReferences;
}

export interface ABI {
    inputs: Input[];
    stateMutability?: StateMutability;
    type: ABIType;
    anonymous?: boolean;
    name?: string;
    outputs?: Input[];
}

export interface Input {
    internalType: InternalTypeEnum;
    name: string;
    type: InternalTypeEnum;
    indexed?: boolean;
    components?: Input[];
}

export enum InternalTypeEnum {
    Address = "address",
    Bool = "bool",
    String = "string",
    StructElectionCandidate = "struct Election.Candidate[]",
    Tuple = "tuple[]",
    Uint256 = "uint256",
    Uint8 = "uint8",
}

export enum StateMutability {
    Nonpayable = "nonpayable",
    View = "view",
}

export enum ABIType {
    Constructor = "constructor",
    Event = "event",
    Function = "function",
}

export interface DeployedLinkReferences {
}
