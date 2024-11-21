import { TypeTree } from "./TypeTree";

export interface SerializedType {
  classId?: number;
  isStrippedType?: boolean;
  scriptTypeIndex?: number;
  type?: TypeTree;
  scriptId?: Buffer;
  oldTypeHash?: Buffer;
  typeDependencies?: number[];
  klassName?: string;
  nameSpace?: string;
  asmName?: string;
}
