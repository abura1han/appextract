import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { nanoid } from "nanoid";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let apkPath;

  try {
    const formData = await request.formData();
    const apkFile = formData.get("apk") as File;

    if (!apkFile) {
      return NextResponse.json(
        { message: "No APK file uploaded" },
        { status: 400 }
      );
    }

    // Create a temporary directory to store the APK
    const tempDir = join(process.cwd(), "temp");
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    apkPath = join(tempDir, `upload-${nanoid()}.apk`);

    // Save the uploaded APK file
    const apkBuffer = Buffer.from(await apkFile.arrayBuffer());
    await writeFile(apkPath, apkBuffer);

    // Extract package name using aapt (Android Asset Packaging Tool)
    // This requires that aapt is installed on the server
    const { stdout: packageOutput } = await execAsync(
      `aapt2 dump badging ${apkPath} | grep package:`
    );

    const packageMatch = packageOutput.match(/package: name='([^']+)'/);
    if (!packageMatch) {
      throw new Error("Failed to extract package name from APK");
    }

    const packageName = packageMatch[1];

    // Extract certificate fingerprint using keytool
    // This requires that Java JDK is installed on the server
    const { stdout: certOutput } = await execAsync(
      `keytool -printcert -jarfile ${apkPath} | grep "SHA256:"`
    );

    const fingerprintMatch = certOutput.match(/SHA256: ([\w:]+)/);
    if (!fingerprintMatch) {
      throw new Error("Failed to extract certificate fingerprint from APK");
    }

    // Format the fingerprint (remove colons and convert to lowercase)
    const fingerprint = fingerprintMatch[1].replace(/:/g, "").toLowerCase();

    // Generate the assetlinks.json content
    const assetLinks = [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: packageName,
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ];

    await unlink(apkPath);

    return NextResponse.json(assetLinks);
  } catch (error) {
    console.error("Error processing APK:", error);
    if (apkPath) await unlink(apkPath);

    return NextResponse.json(
      { message: `Error processing APK: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

// Increase the body size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: "8mb",
  },
};
