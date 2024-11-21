import { BufferReader } from "../BufferReader";
import { SerializedFileFormatVersion } from "../interfaces/SerializedFileFormatVersion";
import { SerializedType } from "../interfaces/SerializedType";
import { SerializedFileHeader } from "./SerializedFileHeader";
import fs from "fs";

export class ObjectInfo {
  byteStart: bigint;
  byteSize: number;
  typeId: number;
  classId?: number;
  isDestroyed?: number;
  stripped?: number;
  pathId: bigint;
  serializedType?: SerializedType;

  constructor(
    header: SerializedFileHeader,
    bigIdEnabled: number,
    types: SerializedType[],
    reader: BufferReader
  ) {
    if (bigIdEnabled) {
      this.pathId = reader.readInt64();
    } else if (header.version < SerializedFileFormatVersion.Unknown_14) {
      this.pathId = BigInt(reader.readInt32());
    } else {
      reader.alignStream(4);
      this.pathId = reader.readInt64();
    }

    if (header.version >= SerializedFileFormatVersion.LargeFilesSupport) {
      this.byteStart = reader.readInt64();
    } else {
      this.byteStart = BigInt(reader.readUInt32());
    }

    this.byteStart += header.dataOffset;
    this.byteSize = reader.readUInt32();
    this.typeId = reader.readInt32();

    if (header.version < SerializedFileFormatVersion.RefactoredClassId) {
      this.classId = reader.readUInt16();
      this.serializedType = types.find((t) => t.classId == this.typeId);
    } else {
      this.serializedType = types[this.typeId];
      this.classId = types[this.typeId].classId;
    }
    if (
      header.version >= SerializedFileFormatVersion.HasScriptTypeIndex &&
      header.version < SerializedFileFormatVersion.RefactorTypeData
    ) {
      const scriptTypeIndex = reader.readInt16();
      if (this.serializedType !== undefined) {
        this.serializedType.scriptTypeIndex = scriptTypeIndex;
      }
    }
    if (
      header.version === SerializedFileFormatVersion.SupportsStrippedObject ||
      header.version === SerializedFileFormatVersion.RefactoredClassId
    ) {
      this.stripped = reader.readByte();
    }
  }
}
