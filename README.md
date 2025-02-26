# AppExtract

AppExtract is an open-source tool that extracts asset links from APK files, allowing developers to generate `assetlinks.json` for Digital Asset Links verification.

## Features
- Upload an APK file to extract the package name and SHA256 certificate fingerprint.
- Generates a valid `assetlinks.json` file for your Android app.
- Uses `aapt2` and `keytool` for extracting metadata.
- Built with Next.js

## Installation

Ensure you have the following dependencies installed on your server:
- [aapt2](https://developer.android.com/studio/command-line/aapt2)
- [Java JDK (for keytool)](https://www.oracle.com/java/technologies/javase-downloads.html)

Then, clone the repository and install dependencies:

```sh
git clone https://github.com/abura1han/appextract.git
cd appextract
npm install
```

## Running Locally

```sh
npm run dev
```

## API Usage

### Upload an APK

**Endpoint:** `POST /api/process-apk`

**Request:**
- `multipart/form-data` with an `apk` file.

**Response:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.app",
      "sha256_cert_fingerprints": ["your_sha256_fingerprint"]
    }
  }
]
```

## Contributing

Feel free to submit issues or pull requests to enhance the functionality.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Happy coding! 🚀


