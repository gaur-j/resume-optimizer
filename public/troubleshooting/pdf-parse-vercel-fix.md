## Troubleshooting

### PDF text extraction fails on Vercel

**Issue**

PDF text extraction works locally but fails after deploying to Vercel.

**Error**

```text
ReferenceError: DOMMatrix is not defined

Failed to load external module pdf-parse-08f4573089f02674
```

**Cause**

The default `PDFParse` initialization did not work correctly in my Vercel deployment.

**Solution**

Initialize `PDFParse` with `CanvasFactory` from `pdf-parse/worker`:

```ts
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

const parser = new PDFParse({
  data: new Uint8Array(buffer),
  CanvasFactory,
});
```

After this change, PDF text extraction worked correctly on both localhost and Vercel.

### Lessons Learned

- Don't assume code that works locally will behave the same in a serverless deployment.
- Always test file processing after deployment.
- Read the library documentation carefully—`pdf-parse` provides a Node-compatible configuration using `CanvasFactory`.
