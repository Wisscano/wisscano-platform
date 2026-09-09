import { NextRequest, NextResponse } from "next/server";
import { uploadFile, UnsupportedFileError, FileTooLargeError } from "@/lib/storage";

/** REST endpoint mirroring actions/upload.ts for non-form-action clients. */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
  }

  try {
    const record = await uploadFile(file);
    return NextResponse.json({ ok: true, mediaId: record.id, filename: record.filename, url: record.url }, { status: 201 });
  } catch (err) {
    if (err instanceof UnsupportedFileError) return NextResponse.json({ ok: false, error: err.message }, { status: 415 });
    if (err instanceof FileTooLargeError) return NextResponse.json({ ok: false, error: err.message }, { status: 413 });
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
