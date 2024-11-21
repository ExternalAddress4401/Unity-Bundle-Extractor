import { BufferReader } from "../BufferReader";
import { SerializedFileFormatVersion } from "../interfaces/SerializedFileFormatVersion";

export class SerializedFileHeader {
  metadataSize: number;
  fileSize: BigInt;
  version: SerializedFileFormatVersion;
  dataOffset: bigint;
  endianess: "little" | "big";
  reserved: Buffer | null = null;

  constructor(reader: BufferReader) {
    this.metadataSize = reader.readUInt32();
    this.fileSize = BigInt(reader.readUInt32());
    this.version = reader.readUInt32();
    this.dataOffset = BigInt(reader.readUInt32());

    if (this.version >= SerializedFileFormatVersion.Unknown_9) {
      this.endianess = reader.readByte() === 0 ? "little" : "big";
      this.reserved = reader.readBytes(3);
    } else {
      reader.index = Number(this.fileSize) - this.metadataSize;
      this.endianess = reader.readByte() === 0 ? "little" : "big";
    }

    if (this.version >= SerializedFileFormatVersion.LargeFilesSupport) {
      this.metadataSize = reader.readUInt32();
      this.fileSize = reader.readInt64();
      this.dataOffset = reader.readInt64();
      reader.readInt64();
    }
  }
}
