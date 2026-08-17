// src/lib/validators.ts
import { z } from 'zod'

export const ContentSchema = z.object({
  type: z.enum(['text', 'image']),
  text: z.string().optional(),
  imageData: z.string().optional(),
  imageName: z.string().optional(),
  imageType: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const TelegramWebhookSchema = z.object({
  update_id: z.number(),
  message: z.object({
    message_id: z.number(),
    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string(),
      last_name: z.string().optional(),
      username: z.string().optional(),
      language_code: z.string().optional(),
    }),
    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      last_name: z.string().optional(),
      username: z.string().optional(),
      type: z.string(),
    }),
    date: z.number(),
    text: z.string().optional(),
    photo: z.array(z.object({
      file_id: z.string(),
      file_unique_id: z.string(),
      file_size: z.number().optional(),
      width: z.number(),
      height: z.number(),
    })).optional(),
    caption: z.string().optional(),
  }),
})