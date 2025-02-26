"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { CloudUpload, Download } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an APK file first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("apk", file);

      const response = await fetch("/api/process-apk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process APK");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        (err as Error).message || "An error occurred while processing the APK"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAssetLinks = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", dataUri);
    downloadLink.setAttribute("download", "assetlinks.json");
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-gray-100">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">AppExtract</h1>
        <p className="text-gray-600 text-sm">Effortlessly generate Digital Asset Links from your APK files.</p>
      </div>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg">APK AssetLinks Generator</CardTitle>
          <CardDescription>
            Upload an APK file to generate an <code>assetlinks.json</code> file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="apk" className="text-sm font-medium">
                  Select APK File
                </label>
                <input
                  id="apk"
                  type="file"
                  accept=".apk"
                  onChange={handleFileChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading || !file}
            >
              {isLoading ? "Processing..." : <><CloudUpload size={16} /> Generate AssetLinks</>}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <div className="p-3 bg-gray-100 rounded-md overflow-auto text-sm font-mono">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
              <Button
                onClick={downloadAssetLinks}
                variant="outline"
                className="mt-2 w-full flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download assetlinks.json
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

