export interface TenantABI {
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
    anonymous?: boolean;
    inputs: Put[];
    name: string;
    type: string;
    outputs?: Put[];
    stateMutability?: string;
}

export interface Put {
    indexed?: boolean;
    internalType: Type;
    name: string;
    type: Type;
}

export enum Type {
    Address = "address",
    String = "string",
}

export interface DeployedLinkReferences {
}
