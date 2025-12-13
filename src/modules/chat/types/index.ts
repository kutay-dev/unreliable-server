import { Message } from 'generated/prisma/client';
import { ChatType } from 'generated/prisma/enums';

export type Membership = { type: ChatType; id: string | null };

export type MessageWithCosineSimilarity = Message & {
  cosine_similarity: number;
};
