import { Schema, model, Types } from "mongoose";

export interface IDocBlock {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  page: number;
  blockIndex: number;
  type: "heading" | "paragraph" | "list";
  text: string;
}

const DocBlockSchema = new Schema<IDocBlock>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    page: { type: Number, required: true },
    blockIndex: { type: Number, required: true },
    type: { type: String, enum: ["heading", "paragraph", "list"], default: "paragraph" },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

DocBlockSchema.index({ documentId: 1, page: 1, blockIndex: 1 }, { unique: true });

export const DocBlock = model<IDocBlock>("DocBlock", DocBlockSchema);
