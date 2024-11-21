import { BufferReader } from "../BufferReader";
import { TypeTreeNode } from "./TypeTreeNode";

export interface TypeTree {
  nodes: TypeTreeNode[];
  stringBuffer?: BufferReader;
}
