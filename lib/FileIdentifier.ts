import { BufferReader } from "../BufferReader";
import { SerializedFileFormatVersion } from "../interfaces/SerializedFileFormatVersion";
import { SerializedFileHeader } from "./SerializedFileHeader";

export class FileIdentifier {
  guid?: Buffer;
  type?: number;
  pathName: string;

  constructor(header: SerializedFileHeader, reader: BufferReader) {
    if (header.version >= SerializedFileFormatVersion.Unknown_6) {
      reader.readString();
    }
    if (header.version >= SerializedFileFormatVersion.Unknown_5) {
      this.guid = reader.readBytes(16);
      this.type = reader.readInt32();
    }
    this.pathName = reader.readString();
  }
}
