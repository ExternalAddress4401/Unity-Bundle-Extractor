import { promises as fs } from "fs";
import { BundleFile } from "./lib/BundleFile";
import { SerializedFile } from "./lib/SerializedFile";

async function start() {
  const bundle = new BundleFile(await fs.readFile("./b.bundle"));
  for (const file of bundle.files) {
    if (file.stream) {
      const w = new SerializedFile(file.stream);
      console.log(w.readFile(file.stream));
    }
  }
}

start();
