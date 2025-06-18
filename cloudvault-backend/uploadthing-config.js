const { createUploadthing } = require("uploadthing/express");
const File = require("./models/File");

const f = createUploadthing();

const uploadRouter = {
  cloudUploader: f({
    "application/pdf": { maxFileSize: "10MB" },
    "image/*": { maxFileSize: "4MB" },
    "text/plain": { maxFileSize: "2MB" },
    "application/octet-stream": { maxFileSize: "20MB" },
  })
    .middleware(async () => {
      return { userId: "anonymous" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ Upload complete:", file);

      try {
        const newFile = new File({
          originalName: file.name,
          uploadThingUrl: file.url,
          uploadThingKey: file.key,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          uploadedAt: new Date(),
          encryptionMethod: "none",
          uploadedBy: metadata.userId,
          uploadMethod: "uploadthing",
        });

        await newFile.save();
        console.log("File saved to MongoDB");
        return { success: true };
      } catch (error) {
        console.error("Error saving file to MongoDB:", error);
        throw new Error("Failed to save file metadata");
      }
    }),
};

module.exports = { uploadRouter };
