// scripts/download-maxmind.ts
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { x } = require("tar");
const { promisify } = require("util");
const stream = require("stream");
const dotenv = require("dotenv");

dotenv.config();

const pipeline = promisify(stream.pipeline);
async function downloadMaxMindDatabase() {
  const LICENSE_KEY = process.env.LICENSE_KEY;
  if (!LICENSE_KEY) {
    throw new Error("MAXMIND_LICENSE_KEY environment variable not set");
  }
  const DB_URL = new URL("https://download.maxmind.com/app/geoip_download");
  DB_URL.searchParams.append("edition_id", "GeoLite2-City");
  DB_URL.searchParams.append("license_key", LICENSE_KEY);
  DB_URL.searchParams.append("suffix", "tar.gz");
  const TMP_DIR = path.join(__dirname, "../temp");
  const TARGET_DIR = path.join(__dirname, "../data/geoip");
  try {
    // Create directories
    await fs.promises.mkdir(TMP_DIR, {
      recursive: true
    });
    await fs.promises.mkdir(TARGET_DIR, {
      recursive: true
    });
    console.log("Downloading MaxMind database...");
    const response = await axios({
      method: "get",
      url: DB_URL.toString(),
      responseType: "stream",
      timeout: 30000
    });
    const tarPath = path.join(TMP_DIR, "geolite2.tar.gz");
    await pipeline(response.data, fs.createWriteStream(tarPath));
    console.log("Extracting database...");
    await x({
      file: tarPath,
      cwd: TMP_DIR,
      strip: 1,
      // Strip the first directory level
      filter: path => path.endsWith(".mmdb")
    });

    // Find the mmdb file in the extracted contents
    const findMMDB = async dir => {
      const files = await fs.promises.readdir(dir, {
        withFileTypes: true
      });
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          const found = await findMMDB(fullPath);
          if (found) return found;
        } else if (file.name.endsWith(".mmdb")) {
          return fullPath;
        }
      }
      return null;
    };
    const mmdbPath = await findMMDB(TMP_DIR);
    if (!mmdbPath) {
      throw new Error("No .mmdb file found in archive after extraction");
    }

    // Move to target location
    const targetPath = path.join(TARGET_DIR, "GeoLite2-City.mmdb");
    await fs.promises.rename(mmdbPath, targetPath);
    console.log("MaxMind database successfully updated at:", targetPath);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    throw error;
  } finally {
    // Cleanup
    try {
      await fs.promises.rm(TMP_DIR, {
        recursive: true,
        force: true
      });
    } catch (cleanupError) {
      console.warn("Cleanup failed:", cleanupError);
    }
  }
}
downloadMaxMindDatabase().then(() => process.exit(0)).catch(() => process.exit(1));