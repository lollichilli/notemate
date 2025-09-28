import { Schema, model, Types } from "mongoose";

export interface IDocument {
  _id: Types.ObjectId;
  title: string;
  uploaderId?: Types.ObjectId | null;
  source: {
    fileType: "md" | "pdf";
    originalName: string;
    sizeBytes: number;
    storageKey: string;
    rawText?: string;
  };
  parse: {
    status: "pending" | "done" | "failed";
    pages?: number;
    engine?: string;
    error?: string | null;
  };
  tags: string[];
}


const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    source: {
      fileType: { type: String, enum: ["md", "pdf"], required: true },
      originalName: { type: String, required: true },
      sizeBytes: { type: Number, required: true },
      storageKey: { type: String, required: true },
      rawText: { type: String, default: "" }
    },
    parse: {
      status: { type: String, enum: ["pending", "done", "failed"], default: "pending", index: true },
      pages: Number,
      engine: String,
      error: String
    },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

DocumentSchema.index({ title: "text", tags: "text" });

export const Document = model<IDocument>("Document", DocumentSchema);
