import fs from "fs";
import { BufferReader } from "../BufferReader";
import { BuildTarget } from "../interfaces/BuildTarget";
import { CommonStrings } from "../interfaces/CommonString";
import { LocalSerializedObectIdentifier } from "../interfaces/LocalSerializedObjectIdentifier";
import { SerializedFileFormatVersion } from "../interfaces/SerializedFileFormatVersion";
import { SerializedType } from "../interfaces/SerializedType";
import { TypeTree } from "../interfaces/TypeTree";
import { TypeTreeNode } from "../interfaces/TypeTreeNode";
import { FileIdentifier } from "./FileIdentifier";
import { LocalSerializedObjectIdentifier } from "./LocalSerializedObjectIdentifier";
import { ObjectInfo } from "./ObjectInfo";
import { SerializedFileHeader } from "./SerializedFileHeader";

export class SerializedFile {
  header: SerializedFileHeader;
  unityVersion: string = "";
  targetPlatform: BuildTarget | null = null;
  enableTypeTree: boolean = false;
  types: SerializedType[] = [];
  bigIdEnabled: number = 0;
  objects: ObjectInfo[] = [];
  scriptTypes: LocalSerializedObectIdentifier[] = [];
  externals: FileIdentifier[] = [];
  refTypes: SerializedType[] = [];
  userInformation: string = "";

  constructor(reader: BufferReader) {
    this.header = new SerializedFileHeader(reader);
    reader.setEndianess(this.header.endianess);

    if (this.header.version >= SerializedFileFormatVersion.Unknown_7) {
      this.unityVersion = reader.readString();
    }
    if (this.header.version >= SerializedFileFormatVersion.Unknown_8) {
      this.targetPlatform = reader.readInt32();
    }
    if (this.header.version >= SerializedFileFormatVersion.HasTypeTreeHashes) {
      this.enableTypeTree = reader.readBoolean();
    }

    // read types
    const typeCount = reader.readInt32();
    for (let i = 0; i < typeCount; i++) {
      this.types.push(this.readSerializedType(reader, false));
    }

    if (
      this.header.version >= SerializedFileFormatVersion.Unknown_7 &&
      this.header.version < SerializedFileFormatVersion.Unknown_14
    ) {
      this.bigIdEnabled = reader.readInt32();
    }

    // read objects
    const objectsCount = reader.readInt32();

    for (let i = 0; i < objectsCount; i++) {
      this.objects.push(
        new ObjectInfo(this.header, this.bigIdEnabled, this.types, reader)
      );
    }

    if (this.header.version >= SerializedFileFormatVersion.HasScriptTypeIndex) {
      const scriptCount = reader.readInt32();
      for (let i = 0; i < scriptCount; i++) {
        this.scriptTypes.push(
          new LocalSerializedObjectIdentifier(this.header, reader)
        );
      }
    }

    const externalsCount = reader.readInt32();
    for (let i = 0; i < externalsCount; i++) {
      this.externals.push(new FileIdentifier(this.header, reader));
    }

    if (this.header.version >= SerializedFileFormatVersion.SupportsRefObject) {
      const refTypesCount = reader.readInt32();
      for (let i = 0; i < refTypesCount; i++) {
        this.refTypes.push(this.readSerializedType(reader, true));
      }
    }

    if (this.header.version >= SerializedFileFormatVersion.Unknown_5) {
      this.userInformation = reader.readString();
    }
  }
  readSerializedType(reader: BufferReader, isRefType: boolean) {
    const type: SerializedType = {};
    type.classId = reader.readInt32();
    if (this.header.version >= SerializedFileFormatVersion.RefactoredClassId) {
      type.isStrippedType = reader.readBoolean();
    }
    if (this.header.version >= SerializedFileFormatVersion.RefactorTypeData) {
      type.scriptTypeIndex = reader.readInt16();
    }
    if (this.header.version >= SerializedFileFormatVersion.HasTypeTreeHashes) {
      if (isRefType && type.scriptTypeIndex && type.scriptTypeIndex >= 0) {
        type.scriptId = reader.readBytes(16);
      } else if (
        (this.header.version < SerializedFileFormatVersion.RefactoredClassId &&
          type.classId < 0) ||
        (this.header.version >= SerializedFileFormatVersion.RefactoredClassId &&
          type.classId === 114)
      ) {
        type.scriptId = reader.readBytes(16);
      }
      type.oldTypeHash = reader.readBytes(16);

      if (this.enableTypeTree) {
        type.type = {
          nodes: [],
        };
        if (
          this.header.version >= SerializedFileFormatVersion.Unknown_12 ||
          this.header.version === SerializedFileFormatVersion.Unknown_10
        ) {
          this.typeTreeBlobRead(reader, type.type);
        }
      } else {
        this.readTypeTree(reader, type.type!);
      }

      if (
        this.header.version >=
        SerializedFileFormatVersion.StoresTypeDependencies
      ) {
        if (isRefType) {
          type.klassName = reader.readString();
          type.nameSpace = reader.readString();
          type.asmName = reader.readString();
        } else {
          type.typeDependencies = reader.readInt32Array();
        }
      }
    }

    return type;
  }
  readTypeTree(reader: BufferReader, type: TypeTree, level: number = 0) {
    const node: TypeTreeNode = {
      level,
      type: reader.readString(),
      name: reader.readString(),
      byteSize: reader.readInt32(),
    };
    if (this.header.version === SerializedFileFormatVersion.Unknown_2) {
      reader.readInt32(); //variableCount
    }
    if (this.header.version !== SerializedFileFormatVersion.Unknown_3) {
      node.index = reader.readInt32();
    }
    node.typeFlags = reader.readInt32();
    node.version = reader.readInt32();
    if (this.header.version !== SerializedFileFormatVersion.Unknown_3) {
      node.metaFlag = reader.readInt32();
    }
    type.nodes.push(node);

    const childrenCount = reader.readInt32();
    for (let i = 0; i < childrenCount; i++) {
      this.readTypeTree(reader, type, level + 1);
    }
  }
  typeTreeBlobRead(reader: BufferReader, type: TypeTree) {
    const numberOfNodes = reader.readInt32();
    const stringBufferSize = reader.readInt32();
    for (let i = 0; i < numberOfNodes; i++) {
      const node: TypeTreeNode = {
        version: reader.readUInt16(),
        level: reader.readByte(),
        typeFlags: reader.readByte(),
        typeStrOffset: reader.readUInt32(),
        nameStrOffset: reader.readUInt32(),
        byteSize: reader.readInt32(),
        index: reader.readInt32(),
        metaFlag: reader.readInt32(),
      };

      if (
        this.header.version >=
        SerializedFileFormatVersion.TypeTreeNodeWithTypeFlags
      ) {
        node.reftypeHash = reader.readUInt64();
      }
      type.nodes.push(node);
    }

    type.stringBuffer = new BufferReader(reader.readBytes(stringBufferSize));
    for (const node of type.nodes) {
      node.type = this.readString(type.stringBuffer, node.typeStrOffset ?? -1);
      node.name = this.readString(type.stringBuffer, node.nameStrOffset ?? -1);
    }
  }
  readString(stringBufferReader: BufferReader, value: number) {
    if (value === -1) {
      throw new Error("Unhandled value in readString");
    }
    const isOffset = (value & 0x80000000) === 0;
    if (isOffset) {
      stringBufferReader.index = value;
      return stringBufferReader.readString();
    }
    const offset = value & 0x7fffffff;
    const entry = CommonStrings.find((el) => el.index === offset);
    return entry?.value ?? offset.toString();
  }
  readFile(reader: BufferReader) {
    const info = this.objects.find((obj) => Number(obj.pathId) !== 1);
    if (!info) {
      throw Error("Failed to parse SerializedFile.");
    }

    const file = new BufferReader(
      reader.slice(
        Number(info.byteStart),
        Number(info.byteStart) + info.byteSize
      ),
      this.header.endianess
    );
    const version = file.readUInt32();
    const str = file.readBytes(4).toString();
    const size = file.readUInt32();

    return reader.slice(reader.index, reader.index + size);
  }
}
