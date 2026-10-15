import * as DocumentPicker from "expo-document-picker";
import { strFromU8 } from "fflate";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export interface PickedFile {
  name: string;
  bytes: Uint8Array;
}

const TYPES = {
  zip: ["application/zip", "application/x-zip-compressed", "*/*"],
  csv: [
    "text/csv",
    "text/comma-separated-values",
    "text/plain",
    "application/vnd.ms-excel",
    "*/*",
  ],
};

/** Lets the person choose a file and reads it on the device. Nothing is uploaded. */
export async function pickFile(
  kind: "zip" | "csv",
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: TYPES[kind],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  let bytes: Uint8Array;
  if (Platform.OS === "web" && asset.file) {
    bytes = new Uint8Array(await asset.file.arrayBuffer());
  } else {
    bytes = await new File(asset.uri).bytes();
  }
  return { name: asset.name, bytes };
}

export function bytesToText(bytes: Uint8Array): string {
  return strFromU8(bytes);
}
