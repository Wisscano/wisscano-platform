/**
 * MALWARE / SECURITY SCREENING (mandatory — master spec §12-16).
 *
 * Every file uploaded through the Request Bar or Admin Centre passes
 * through this module BEFORE it is ever considered usable: before it can
 * be attached to a WhatsApp handoff, before an admin can open it, before
 * it's served publicly. The pipeline is:
 *
 *   upload -> quarantine storage -> scanFile() -> verdict -> media row updated
 *
 * IMPORTANT — READ BEFORE DEPLOYING:
 * This repo does not have network access to install or configure a real
 * antivirus engine, so `HeuristicScanner` below is a genuine but LIMITED
 * first line of defense: content-vs-declared-type verification, embedded
 * script/executable signature checks, and structural sanity checks. It is
 * NOT a substitute for a real malware engine. `scanFile()` is written as
 * a swappable interface specifically so a production scanner — ClamAV
 * (via clamd, e.g. the `clamscan` npm client against a clamd daemon) or a
 * managed API (e.g. VirusTotal, MetaDefender) — can be dropped in via
 * `getScanner()` without touching the upload/procurement code that calls
 * it. Do not remove this gate and do not treat "error" as "safe" — a
 * scanner failure or timeout must reject the file, never silently pass it.
 */

export type ScanVerdict = "clean" | "infected" | "error" | "rejected";

export interface ScanResult {
  verdict: ScanVerdict;
  provider: string;
  details: string;
}

export interface MalwareScanner {
  readonly providerName: string;
  scan(bytes: Uint8Array, declaredMimeType: string, filename: string): Promise<ScanResult>;
}

// Magic-byte signatures for the file types we actually allow (see lib/storage.ts ALLOWED_MIME_TYPES).
// Used to catch a file whose *content* doesn't match its declared MIME type/extension —
// a common disguise technique (§13: "malicious payloads disguised through filenames/extensions").
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF container; WEBP marker follows at offset 8
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  // Office Open XML (docx/xlsx) and legacy zip-based formats all start as ZIP archives
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4b, 0x03, 0x04]],
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0]], // legacy OLE compound file
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0]],
  "text/csv": [], // plain text — no reliable magic bytes, checked via content heuristics instead
};

// Byte sequences that should never appear in a document/image we intend to forward as a
// business attachment — covers common embedded-executable and script-injection patterns.
const DANGEROUS_SIGNATURES: { bytes: number[]; label: string }[] = [
  { bytes: [0x4d, 0x5a], label: "Windows PE/EXE header (MZ)" }, // at offset 0 specifically checked separately
  { bytes: [0x25, 0x21, 0x50, 0x53], label: "PostScript with potential exec directive" },
];

const SCRIPT_PATTERNS = [/<script[\s>]/i, /<\?php/i, /powershell\s+-enc/i, /eval\(/i, /\bActiveXObject\b/i];

function bytesStartWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[i] !== sig[i]) return false;
  return true;
}

function containsSubsequence(bytes: Uint8Array, sig: number[], searchLimit = 4096): boolean {
  const limit = Math.min(bytes.length - sig.length, searchLimit);
  outer: for (let i = 0; i <= limit; i++) {
    for (let j = 0; j < sig.length; j++) if (bytes[i + j] !== sig[j]) continue outer;
    return true;
  }
  return false;
}

class HeuristicScanner implements MalwareScanner {
  readonly providerName = "wisscano-heuristic-v1";

  async scan(bytes: Uint8Array, declaredMimeType: string, filename: string): Promise<ScanResult> {
    // 1. Double-extension / suspicious filename check (§13)
    const suspiciousExt = /\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|msi|ps1|sh|dll)(\.[a-z0-9]+)?$/i;
    if (suspiciousExt.test(filename)) {
      return { verdict: "rejected", provider: this.providerName, details: `Filename matches a disallowed/executable pattern: ${filename}` };
    }
    if ((filename.match(/\./g) || []).length > 2) {
      return { verdict: "rejected", provider: this.providerName, details: "Filename has multiple extensions, a common disguise technique" };
    }

    // 2. Magic-byte verification: does the content actually match the declared type?
    const knownSignatures = MAGIC_BYTES[declaredMimeType];
    if (knownSignatures && knownSignatures.length > 0) {
      const matches = knownSignatures.some((sig) => bytesStartWith(bytes, sig));
      if (!matches) {
        return { verdict: "rejected", provider: this.providerName, details: `File content does not match declared type ${declaredMimeType}` };
      }
    }

    // 3. Reject if it's secretly a Windows executable regardless of declared type
    if (bytesStartWith(bytes, [0x4d, 0x5a])) {
      return { verdict: "infected", provider: this.providerName, details: "File begins with an MZ (Windows executable) header" };
    }

    // 4. Scan for embedded script/exec signatures in the first portion of the file
    for (const sig of DANGEROUS_SIGNATURES) {
      if (containsSubsequence(bytes, sig.bytes)) {
        return { verdict: "infected", provider: this.providerName, details: `Matched dangerous signature: ${sig.label}` };
      }
    }
    if (declaredMimeType.startsWith("image/") || declaredMimeType === "application/pdf") {
      const textSample = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 8192));
      for (const pattern of SCRIPT_PATTERNS) {
        if (pattern.test(textSample)) {
          return { verdict: "infected", provider: this.providerName, details: `Embedded script pattern detected: ${pattern}` };
        }
      }
    }

    // 5. Zip-bomb / decompression-bomb guard for zip-based formats (docx/xlsx) — reject absurd size vs plausible content
    if (bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]) && bytes.length > 18 * 1024 * 1024) {
      return { verdict: "rejected", provider: this.providerName, details: "Zip-based document exceeds safe size threshold" };
    }

    return { verdict: "clean", provider: this.providerName, details: "Passed content-type, signature and structural checks" };
  }
}

/**
 * Swap point for a production scanner. Example future implementation:
 *
 *   class ClamAvScanner implements MalwareScanner {
 *     readonly providerName = "clamav";
 *     async scan(bytes, mime, filename) {
 *       const result = await clamscan.scanBuffer(Buffer.from(bytes));
 *       return result.isInfected
 *         ? { verdict: "infected", provider: this.providerName, details: result.viruses.join(", ") }
 *         : { verdict: "clean", provider: this.providerName, details: "clamd: no threats found" };
 *     }
 *   }
 *
 * Select it here based on env config once a real engine is provisioned —
 * nothing else in the codebase needs to change.
 */
export function getScanner(): MalwareScanner {
  return new HeuristicScanner();
}

/**
 * Runs the scan with a hard timeout — a hung/unresponsive scanner must
 * fail closed (verdict: "error", treated as unsafe), never fail open.
 */
export async function scanFile(bytes: Uint8Array, declaredMimeType: string, filename: string): Promise<ScanResult> {
  const scanner = getScanner();
  const TIMEOUT_MS = 15000;

  try {
    const result = await Promise.race([
      scanner.scan(bytes, declaredMimeType, filename),
      new Promise<ScanResult>((resolve) =>
        setTimeout(() => resolve({ verdict: "error", provider: scanner.providerName, details: "Scan timed out" }), TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch (err) {
    return { verdict: "error", provider: scanner.providerName, details: err instanceof Error ? err.message : "Unknown scan error" };
  }
}
