import { BufferReader } from "../BufferReader";
import { StorageBlockFlags } from "../interfaces/StorageBlockFlags";

export class StorageBlock {
  uncompressedSize: number;
  compressedSize: number;
  flags: StorageBlockFlags;

  constructor(reader: BufferReader) {
    this.uncompressedSize = reader.readUInt32();
    this.compressedSize = reader.readUInt32();
    this.flags = reader.readUInt16() as StorageBlockFlags;
  }
}
