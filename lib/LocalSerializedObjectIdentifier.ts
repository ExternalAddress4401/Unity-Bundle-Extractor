import { BufferReader } from "../BufferReader";
import { SerializedFileFormatVersion } from "../interfaces/SerializedFileFormatVersion";
import { SerializedFileHeader } from "./SerializedFileHeader";

export class LocalSerializedObjectIdentifier {
  header: SerializedFileHeader;
  localSerializedFileIndex: number;
  localIdentifierInFile: bigint;

  constructor(header: SerializedFileHeader, reader: BufferReader) {
    this.header = header;
    this.localSerializedFileIndex = reader.readInt32();
    if (this.header.version < SerializedFileFormatVersion.Unknown_14) {
      this.localIdentifierInFile = BigInt(reader.readInt32());
    } else {
      reader.alignStream(4);
      this.localIdentifierInFile = reader.readInt64();
    }
  }
}
