import { BufferReader } from "../BufferReader";

export class StreamFile {
  path: string;
  fileName: string;
  stream: BufferReader | null = null;

  constructor(path: string, fileName: string, stream: Buffer) {
    this.path = path;
    this.fileName = fileName;
    this.stream = new BufferReader(stream);
  }
}
