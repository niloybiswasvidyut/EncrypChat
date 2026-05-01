import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBuffer(buffer, filename, resourceType = "auto") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "encrypchat",
        public_id: `${Date.now()}-${nanoid(8)}-${filename}`,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({
        url: "",
        name: file.name,
        size: file.size,
        mimeType: file.type,
        warning:
          "Cloudinary keys missing. Configure env values to upload and get hosted URLs.",
      });
    }

    const uploaded = await uploadBuffer(buffer, file.name);

    return NextResponse.json({
      url: uploaded.secure_url,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
