const fs = require("fs");
const p = "app/video-converter/page.tsx";
let s = fs.readFileSync(p, "utf8");

function replaceOnce(oldStr, newStr, label) {
  const count = s.split(oldStr).length - 1;
  if (count !== 1) {
    throw new Error("Expected exactly 1 match for " + label + " but found " + count);
  }
  s = s.replace(oldStr, newStr);
}

replaceOnce(
  `  const [documentJson, setDocumentJson] = useState<any | null>(null);\n  const pollingRef = useRef<number | null>(null);`,
  `  const [documentJson, setDocumentJson] = useState<any | null>(null);\n  const [movieJson, setMovieJson] = useState<any | null>(null);\n  const [conversionDiagnostics, setConversionDiagnostics] = useState<any | null>(null);\n  const pollingRef = useRef<number | null>(null);`,
  "state decls"
);

replaceOnce(
  `  const inspectApiUrl = process.env.NEXT_PUBLIC_INSPECT_API_URL || "/api/inspect-document";`,
  `  const inspectApiUrl = process.env.NEXT_PUBLIC_INSPECT_API_URL || "/api/inspect-document";\n  const convertApiUrl = process.env.NEXT_PUBLIC_CONVERT_API_URL || "/api/convert-document";`,
  "convertApiUrl"
);

replaceOnce(
  `    setResultUrl(null);\n    setDocumentJson(null);\n\n    try {\n      if (selectedFile) {`,
  `    setResultUrl(null);\n    setDocumentJson(null);\n    setMovieJson(null);\n    setConversionDiagnostics(null);\n\n    try {\n      if (selectedFile) {`,
  "reset state"
);

replaceOnce(
  `        setDocumentJson(data);\n        setIsLoading(false);\n        return;\n      }`,
  `        setDocumentJson(data);\n\n        try {\n          const convertResp = await fetch(convertApiUrl, {\n            method: 'POST',\n            headers: {\n              'Content-Type': selectedFile.type || 'application/octet-stream',\n              'X-Filename': selectedFile.name,\n            },\n            body: arrayBuffer,\n          });\n          const convertData = await convertResp.json().catch(() => null);\n          if (convertResp.ok && convertData && convertData.success !== false) {\n            setMovieJson(convertData.movie);\n            setConversionDiagnostics(convertData.diagnostics);\n          } else {\n            setErrorMessage((convertData && convertData.error) || 'Failed to generate scene plan / movie JSON.');\n          }\n        } catch (convertErr) {\n          setErrorMessage(convertErr instanceof Error ? convertErr.message : 'Failed to generate scene plan / movie JSON.');\n        }\n\n        setIsLoading(false);\n        return;\n      }`,
  "convert fetch insert"
);

replaceOnce(
  `        {documentJson ? (\n          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">\n            <h3 className="font-semibold text-gray-900 mb-2">Extracted Document JSON</h3>\n            <pre className="text-sm text-gray-800 overflow-auto max-h-96 p-2 bg-slate-50 rounded">\n              {JSON.stringify(documentJson, null, 2)}\n            </pre>\n          </div>\n        ) : null}`,
  `        {documentJson ? (\n          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">\n            <h3 className="font-semibold text-gray-900 mb-2">Extracted Document JSON</h3>\n            <pre className="text-sm text-gray-800 overflow-auto max-h-96 p-2 bg-slate-50 rounded">\n              {JSON.stringify(documentJson, null, 2)}\n            </pre>\n          </div>\n        ) : null}\n\n        {conversionDiagnostics ? (\n          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">\n            <h3 className="font-semibold text-gray-900 mb-2">Scene Planning Diagnostics</h3>\n            <pre className="text-sm text-gray-800 overflow-auto max-h-64 p-2 bg-slate-50 rounded">\n              {JSON.stringify(conversionDiagnostics, null, 2)}\n            </pre>\n          </div>\n        ) : null}\n\n        {movieJson ? (\n          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4">\n            <h3 className="font-semibold text-gray-900 mb-2">Generated Movie JSON (Multi-Scene)</h3>\n            <pre className="text-sm text-gray-800 overflow-auto max-h-96 p-2 bg-slate-50 rounded">\n              {JSON.stringify(movieJson, null, 2)}\n            </pre>\n          </div>\n        ) : null}`,
  "jsx blocks"
);

fs.writeFileSync(p, s, "utf8");
console.log("PATCH_APPLIED_OK");