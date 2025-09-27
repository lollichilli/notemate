import { Schema, model, Types } from "mongoose";

export interface IDeck {
  _id: Types.ObjectId;
  name: string;
  ownerId?: Types.ObjectId | null;
  workspaceId?: Types.ObjectId | null;
  visibility: "private" | "workspace";
}

const DeckSchema = new Schema<IDeck>(
  {
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
    visibility: { type: String, enum: ["private", "workspace"], default: "private" }
  },
  { timestamps: true }
);

DeckSchema.index({ name: 1, createdAt: -1 });

export const Deck = model<IDeck>("Deck", DeckSchema);
