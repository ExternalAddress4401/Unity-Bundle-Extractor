import { BufferReader } from "../BufferReader";
import { ArchiveFlags } from "../interfaces/ArchiveFlags";

export class Header {
  signature: string;
  version: number;
  unityVersion: string;
  unityRevision: string;
  size: BigInt;
  compressedBlocksInfoSize: number;
  uncompressedBlocksInfoSize: number;
  flags: ArchiveFlags;

  constructor(reader: BufferReader) {
    this.signature = reader.readString();
    this.version = reader.readUInt32();
    this.unityVersion = reader.readString();
    this.unityRevision = reader.readString();
    this.size = reader.readInt64();
    this.compressedBlocksInfoSize = reader.readUInt32();
    this.uncompressedBlocksInfoSize = reader.readUInt32();
    this.flags = reader.readUInt32();
  }
}
