const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = () => process.env.AWS_BUCKET_NAME;

const putPdf = (key, buffer) =>
  s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    }),
  );

// Works for both new rows and old rows: the key is read back out of the stored URL.
const keyFromUrl = (fileUrl) => {
  try {
    const key = decodeURIComponent(new URL(fileUrl).pathname.slice(1));
    return key.startsWith("resources/") ? key : null;
  } catch {
    return null;
  }
};

// Short-lived link so the bucket itself can stay private.
const presignedGetUrl = (key) =>
  getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: 300 },
  );

const deleteObject = async (key) => {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));
  } catch (err) {
    console.error("S3_DELETE_ERROR (non-fatal):", err.message);
  }
};

const publicUrlForKey = (key) =>
  `https://${BUCKET()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

module.exports = { putPdf, keyFromUrl, presignedGetUrl, deleteObject, publicUrlForKey };
