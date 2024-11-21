import { BufferReader } from "../BufferReader";
import { ArchiveFlags } from "../interfaces/ArchiveFlags";
import { CompressionType } from "../interfaces/CompressionType";
import { Header } from "./Header";
import { StorageBlock } from "./StorageBlock";
import { Node } from "./Node";
import lz4 from "lz4";
import lzma from "lzma";
import { StorageBlockFlags } from "../interfaces/StorageBlockFlags";
import { StreamFile } from "./StreamFile";
import fs from "fs";

export class BundleFile {
  reader: BufferReader;
  header: Header;
  m_blocksInfo: StorageBlock[] = [];
  m_directoryInfo: Node[] = [];
  files: StreamFile[] = [];

  constructor(file: Buffer) {
    this.reader = new BufferReader(file);
    this.header = new Header(this.reader);
    this.readBlocksInfoAndDirectory();
    const decompressedBlocks = this.readBlocks();
    this.readFiles(decompressedBlocks);
  }
  readBlocksInfoAndDirectory() {
    let blocksInfoBytes: Buffer;

    if (this.header.version >= 7) {
      this.reader.alignStream(16);
    }

    if ((this.header.flags & ArchiveFlags.BlocksInfoAtTheEnd) != 0) {
      const pos = this.reader.index;
      this.reader.index =
        this.reader.buffer.length - this.header.compressedBlocksInfoSize;
      blocksInfoBytes = this.reader.readBytes(
        this.header.compressedBlocksInfoSize
      );
      this.reader.index = pos;
    } else {
      blocksInfoBytes = this.reader.readBytes(
        this.header.compressedBlocksInfoSize
      );
    }

    let blocksInfoUncompressedStream: any;

    const compressionType = (this.header.flags &
      ArchiveFlags.CompressionTypeMask) as CompressionType;
    switch (compressionType) {
      case CompressionType.None:
        blocksInfoUncompressedStream = new BufferReader(blocksInfoBytes);
        break;
      case CompressionType.Lzma:
        console.log("NEI");
        break;
      case CompressionType.Lz4:
      case CompressionType.Lz4HC:
        const uncompressed = Buffer.alloc(
          this.header.uncompressedBlocksInfoSize
        );
        lz4.decodeBlock(blocksInfoBytes, uncompressed);
        blocksInfoUncompressedStream = new BufferReader(uncompressed);
        break;
    }

    const uncompressedDataHash = blocksInfoUncompressedStream.readBytes(16);
    const blocksInfoCount = blocksInfoUncompressedStream.readInt32();
    for (let i = 0; i < blocksInfoCount; i++) {
      this.m_blocksInfo.push(new StorageBlock(blocksInfoUncompressedStream));
    }
    const nodesCount = blocksInfoUncompressedStream.readInt32();
    for (let i = 0; i < nodesCount; i++) {
      this.m_directoryInfo.push(new Node(blocksInfoUncompressedStream));
    }
    if ((this.header.flags & ArchiveFlags.BlockInfoNeedPaddingAtStart) != 0) {
      this.reader.alignStream(16);
    }
  }
  readBlocks() {
    const bufferSize = this.m_blocksInfo.reduce(
      (prev, curr) => prev + curr.uncompressedSize,
      0
    );
    const blocks = new BufferReader(Buffer.alloc(bufferSize));
    for (const block of this.m_blocksInfo) {
      const compressionType =
        block.flags & StorageBlockFlags.CompressionTypeMask;
      switch (compressionType) {
        case CompressionType.None:
          blocks.writeBuffer(this.reader.readBytes(block.compressedSize));
          break;
        case CompressionType.Lzma:
          const buff = new BufferReader(
            this.reader.readBytes(block.compressedSize)
          );
          buff.insert(
            Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
            5
          );
          const w = Buffer.from(lzma.decompress(buff.buffer));
          blocks.writeBuffer(w);
          break;
        case CompressionType.Lz4:
        case CompressionType.Lz4HC:
          const uncompressed = Buffer.alloc(block.uncompressedSize);
          lz4.decodeBlock(
            this.reader.readBytes(block.compressedSize),
            uncompressed
          );

          blocks.writeBuffer(uncompressed);
          break;
      }
    }
    return blocks;
  }
  readFiles(reader: BufferReader) {
    for (const node of this.m_directoryInfo) {
      this.files.push(
        new StreamFile(
          node.path,
          node.path,
          reader.readBytes(Number(node.size))
        )
      );
    }
    this.reader.index = 0;
  }
}
