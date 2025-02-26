import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir, stat } from "fs/promises";
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

    const tempDir = join(process.cwd(), "temp");
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    apkPath = join(tempDir, `upload-${nanoid()}.apk`);
    const apkBuffer = Buffer.from(await apkFile.arrayBuffer());
    await writeFile(apkPath, apkBuffer);

    const { stdout: aaptOutput } = await execAsync(`aapt2 dump badging ${apkPath}`);
    
    const packageMatch = aaptOutput.match(/package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/);
    if (!packageMatch) {
      throw new Error("Failed to extract package information");
    }

    const [_, packageName, versionCode, versionName] = packageMatch;
    console.log(`What is it? `, _)
    const labelMatch = aaptOutput.match(/application-label:'([^']+)'/);
    const appLabel = labelMatch ? labelMatch[1] : "Unknown";
    
    const iconMatch = aaptOutput.match(/application-icon-\d+:'([^']+)'/);
    let appIconBase64 = null;
    if (iconMatch) {
      // iconPath = join(tempDir, iconMatch[1]);
      try {
        // const iconBuffer = await writeFile(iconPath, apkBuffer);
        appIconBase64 = `data:image/png;base64,${apkBuffer.toString("base64")}`;
      } catch (iconError) {
        console.error("Failed to extract app icon:", iconError);
      }
    }
    
    const permissionMatches = aaptOutput.matchAll(/uses-permission: name='([^']+)'/g);
    const permissions = Array.from(permissionMatches, (match) => match[1]);
    
    const sdkMatch = aaptOutput.match(/sdkVersion:'(\d+)'/);
    const minSdk = sdkMatch ? sdkMatch[1] : "Unknown";
    
    const targetSdkMatch = aaptOutput.match(/targetSdkVersion:'(\d+)'/);
    const targetSdk = targetSdkMatch ? targetSdkMatch[1] : "Unknown";
    
    const activityMatches = aaptOutput.matchAll(/launchable-activity: name='([^']+)'/g);
    const activities = Array.from(activityMatches, (match) => match[1]);
    
    const architectureMatch = aaptOutput.match(/native-code: '([^']+)'/);
    const architectures = architectureMatch ? architectureMatch[1].split("' '") : [];
    
    const { stdout: certOutput } = await execAsync(
      `keytool -printcert -jarfile ${apkPath} | grep "SHA256:"`
    );
    
    const fingerprintMatch = certOutput.match(/SHA256: ([\w:]+)/);
    if (!fingerprintMatch) {
      throw new Error("Failed to extract certificate fingerprint");
    }
    const fingerprint = fingerprintMatch[1].replace(/:/g, "").toLowerCase();
    
    const fileStats = await stat(apkPath);
    const apkSize = fileStats.size;
    
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

    return NextResponse.json({
      packageName,
      versionCode,
      versionName,
      appLabel,
      appIconBase64,
      permissions,
      minSdk,
      targetSdk,
      architectures,
      activities,
      apkSize,
      assetLinks,
    });
  } catch (error) {
    console.error("Error processing APK:", error);
    if (apkPath) await unlink(apkPath);

    return NextResponse.json(
      { message: `Error processing APK: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: "8mb",
  },
};
