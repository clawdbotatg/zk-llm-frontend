declare module "@noir-lang/noir_js" {
  export class Noir {
    constructor(circuit: any);
    execute(inputs: Record<string, any>): Promise<{ witness: Uint8Array }>;
  }
}

declare module "@aztec/bb.js" {
  export class UltraHonkBackend {
    constructor(bytecode: string);
    generateProof(witness: Uint8Array): Promise<{
      proof: Uint8Array;
      publicInputs: string[];
    }>;
    destroy(): void;
  }
}
