/**
 * Google Cloud Storage Service for AI MemeForge
 * 
 * ⚠️ IMPORTANT: GCS Bucket Configuration
 * =====================================
 * The bucket "memeforge-images-web3ai" uses UNIFORM bucket-level access.
 * This means:
 * 
 * 1. DO NOT use `public: true` in createWriteStream options
 * 2. DO NOT call file.makePublic() after upload
 * 3. Public access is controlled via IAM policy on the bucket, not per-object ACL
 * 
 * If you see "Cannot insert legacy ACL for an object when uniform bucket-level 
 * access is enabled" error, it means someone added ACL code that should be removed.
 * 
 * Reference: https://cloud.google.com/storage/docs/uniform-bucket-level-access
 */

const { Storage } = require("@google-cloud/storage");

class StorageService {
  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    this.bucketName = process.env.GCS_BUCKET_NAME || "memeforge-images-web3ai";
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async uploadImage(imageBuffer, filename, metadata = {}) {
    try {
      const file = this.bucket.file(`memes/${filename}`);
      
      // ⚠️ NEVER add "public: true" here - bucket uses uniform access via IAM
      const stream = file.createWriteStream({
        metadata: {
          contentType: metadata.contentType || "image/png",
          metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString(),
            source: "memeforge-ai"
          }
        },
        resumable: false
      });

      return new Promise((resolve, reject) => {
        stream.on("error", (error) => {
          console.error("Upload error:", error);
          reject(new Error(`Failed to upload image: ${error.message}`));
        });

        stream.on("finish", () => {
          // Bucket is publicly readable via IAM policy - no makePublic() needed
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/memes/${filename}`;
          
          console.log(`✅ Image uploaded to GCS: ${filename}`);
          
          resolve({
            success: true,
            url: publicUrl,
            filename,
            bucketName: this.bucketName
          });
        });

        stream.end(imageBuffer);
      });
    } catch (error) {
      console.error("Error uploading to GCS:", error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }
  }

  async uploadImageFromUrl(imageUrl, filename, metadata = {}) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      return await this.uploadImage(imageBuffer, filename, metadata);
    } catch (error) {
      console.error("Error uploading image from URL:", error);
      throw new Error(`Failed to upload from URL: ${error.message}`);
    }
  }

  async deleteImage(filename) {
    try {
      const file = this.bucket.file(`memes/${filename}`);
      await file.delete();
      
      return {
        success: true,
        message: `Image ${filename} deleted successfully`
      };
    } catch (error) {
      console.error("Error deleting image:", error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async listImages(prefix = "memes/") {
    try {
      const [files] = await this.bucket.getFiles({ prefix });
      
      const images = files.map(file => ({
        name: file.name,
        publicUrl: `https://storage.googleapis.com/${this.bucketName}/${file.name}`,
        metadata: file.metadata,
        created: file.metadata.timeCreated
      }));

      return {
        success: true,
        images,
        count: images.length
      };
    } catch (error) {
      console.error("Error listing images:", error);
      throw new Error(`Failed to list images: ${error.message}`);
    }
  }

  generateFilename(prefix = "meme", extension = "png") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  async testConnection() {
    try {
      await this.bucket.getMetadata();
      return {
        success: true,
        message: "Google Cloud Storage connection successful",
        bucketName: this.bucketName
      };
    } catch (error) {
      return {
        success: false,
        message: `GCS connection failed: ${error.message}`,
        error: error.message
      };
    }
  }
}

module.exports = new StorageService();
