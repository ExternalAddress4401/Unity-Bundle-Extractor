export class BufferReader {
  buffer: Buffer;
  index: number = 0;
  endianess: "little" | "big";

  constructor(buffer: Buffer, endianess: "little" | "big" = "big") {
    this.buffer = buffer;
    this.endianess = endianess;
  }
  readByte() {
    return this.buffer.readUInt8(this.index++);
  }
  readBytes(count: number) {
    const bytes = this.buffer.subarray(this.index, this.index + count);
    this.index += count;
    return bytes;
  }
  insert(buffer: Buffer, position: number) {
    const oldIndex = this.index;
    this.index = 0;
    const start = this.buffer.subarray(0, position);
    const end = this.buffer.subarray(position);
    this.index = oldIndex + buffer.length;

    this.buffer = Buffer.concat([start, buffer, end]);
  }
  readString() {
    let str = "";
    let b: number;
    do {
      b = this.readByte();
      str += String.fromCharCode(b);
    } while (b !== 0);

    return str.slice(0, -1);
  }
  readInt16() {
    const int =
      this.endianess === "little"
        ? this.buffer.readInt16LE(this.index)
        : this.buffer.readInt16BE(this.index);
    this.index += 2;
    return int;
  }
  readUInt16() {
    const uint =
      this.endianess === "little"
        ? this.buffer.readUInt16LE(this.index)
        : this.buffer.readUInt16BE(this.index);
    this.index += 2;
    return uint;
  }
  readInt32() {
    const int =
      this.endianess === "little"
        ? this.buffer.readInt32LE(this.index)
        : this.buffer.readInt32BE(this.index);
    this.index += 4;
    return int;
  }
  readUInt32() {
    const uint =
      this.endianess === "little"
        ? this.buffer.readUInt32LE(this.index)
        : this.buffer.readUInt32BE(this.index);
    this.index += 4;
    return uint;
  }
  readUInt64() {
    const int =
      this.endianess === "little"
        ? this.buffer.readBigUInt64LE(this.index)
        : this.buffer.readBigUInt64BE(this.index);
    this.index += 8;
    return int;
  }
  readInt64() {
    const int =
      this.endianess === "little"
        ? this.buffer.readBigInt64LE(this.index)
        : this.buffer.readBigInt64BE(this.index);
    this.index += 8;
    return int;
  }
  alignStream(alignment: number) {
    const pos = this.index;
    var mod = pos % alignment;
    if (mod != 0) {
      this.index += alignment - mod;
    }
  }
  writeBuffer(buffer: Buffer) {
    buffer.copy(this.buffer, this.index, 0, buffer.length);
  }
  readBoolean() {
    return this.readByte() == 1;
  }
  readInt32Array() {
    return this.readArray(this.readInt32, this.readInt32());
  }
  readArray(func: Function, length: number) {
    const array = [];
    for (let i = 0; i < length; i++) {
      array.push(func());
    }
    return array;
  }
  setEndianess(endianess: "little" | "big") {
    this.endianess = endianess;
  }
  slice(start: number, end: number) {
    return this.buffer.subarray(start, end);
  }
}
