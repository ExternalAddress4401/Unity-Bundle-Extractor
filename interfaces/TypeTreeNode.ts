export interface TypeTreeNode {
  type?: string;
  name?: string;
  byteSize?: number;
  index?: number;
  typeFlags?: number;
  version?: number;
  metaFlag?: number;
  level?: number;
  typeStrOffset?: number;
  nameStrOffset?: number;
  reftypeHash?: BigInt;
}
