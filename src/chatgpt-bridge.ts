import { log, Message } from "wechaty";
import { ChatGPTAPI } from "chatgpt";
import dotenv from "dotenv";
dotenv.config();

const api = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY!,
  maxModelTokens: 4000,
  maxResponseTokens: 1000,
});

let parentMessageId: string = "";

export async function processMessage(msg: Message) {
  const talker = msg.talker();
  const listener = msg.listener();
  const room = msg.room();
  const isMentionSelf = await msg.mentionSelf();

  let text = msg.text();
  if (text.length > 200) {
    return;
  }

  if (talker.name() === listener?.name()) {
    return;
  }

  if (msg.self()) {
    return;
  }

  // group chat
  if (room && isMentionSelf) {
    let listenerName = "";
    if (listener) {
      const alias = await room.alias(listener);
      listenerName = alias || listener.name();
    }
    text = text.replace(`@${listenerName}`, "");
    log.info(`group message: ${text}`);

    if (text) {
      text = text.trim();
      const reply = await chatGPTReply(text);
      await room.say(reply);
    }
  }

  // private chat
  if (!room) {
    const reply = await chatGPTReply(text);
    await talker.say(reply);
  }
}

async function chatGPTReply(prompt: string) {
  try {
    log.info("prompt: ", prompt);
    // If you want your response to have historical context, you must provide a valid `parentMessageId`.
    const response = await api.sendMessage(prompt, {
      parentMessageId,
    });

    const reply = response.text;
    parentMessageId = response.id;
    log.info("reply: ", reply);
    return reply;
  } catch (error: any) {
    log.error(error.toString());
    return "发生了一些错误，请稍后再试。";
  }
}
