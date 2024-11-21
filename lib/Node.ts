import { BufferReader } from "../BufferReader";

export class Node {
  offset: BigInt;
  size: BigInt;
  flags: number;
  path: string;

  constructor(reader: BufferReader) {
    this.offset = reader.readInt64();
    this.size = reader.readInt64();
    this.flags = reader.readUInt32();
    this.path = reader.readString();
  }
}
