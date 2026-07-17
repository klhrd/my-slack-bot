require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// ==================== 1. 幫助與說明 ====================

app.command("/bot-help", async ({ ack, respond }) => {
    await ack();
    await respond({
        text: `🤖 *Ryder 的精簡版機器人指令清單* 🤖\n\n` +
              `• \`/bot-help\` - 顯示此說明選單\n` +
              `• \`/bot-ask [問題]\` - 與免費騰訊 Hy3 AI 對話 🧠\n` +
              `• \`/bot-joke\` - 聽個隨機英文笑話 😆\n` +
              `• \`/bot-dog\` - 看隨機可愛狗狗照片 🐶\n` +
              `• \`/bot-bored\` - 覺得無聊時的活動點子 🎯\n` +
              `• \`/bot-anime\` - 隨機動漫名言 🎬`
    });
});

// ==================== 2. 趣味 API 區 ====================

// 英文笑話
app.command("/bot-joke", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
        await respond({
            text: `😆 *來個笑話：*\n\n*${response.data.setup}*\n\n_${response.data.punchline}_`
        });
    } catch (err) {
        await respond({ text: "笑話庫暫時打不開了 😭" });
    }
});

// 隨機狗狗圖
app.command("/bot-dog", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://dog.ceo/api/breeds/image/random");
        await respond({
            text: "🐶 這裡有一隻可愛的狗狗送給你！",
            blocks: [
                {
                    type: "image",
                    title: { type: "plain_text", text: "Cute Dog!" },
                    image_url: response.data.message,
                    alt_text: "A cute dog"
                }
            ]
        });
    } catch (err) {
        await respond({ text: "狗狗跑掉了，載入失敗 🦴" });
    }
});

// 無聊救星
app.command("/bot-bored", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://bored-api.apphost.io/api/activity");
        await respond({
            text: `🎯 *無聊時你可以試試看做這件事：*\n\n👉 *${response.data.activity}* \n(類型: ${response.data.type} | 參與人數: ${response.data.participants} 人)`
        });
    } catch (err) {
        await respond({ text: "沒事做就去寫程式吧！ 😅" });
    }
});

// 動漫名言
app.command("/bot-anime", async ({ ack, respond }) => {
    await ack();
    try {
        const response = await axios.get("https://animechan.xyz/api/random");
        await respond({
            text: `🎬 *動漫名言：*\n\n> "${response.data.quote}"\n\n—— *${response.data.character}* (${response.data.anime})`
        });
    } catch (err) {
        await respond({ text: "動漫名言暫時載入失敗 ⚔️" });
    }
});

// ==================== 3. Hack Club AI 區 ====================

app.command("/bot-ask", async ({ command, ack, respond }) => {
    await ack();

    const userPrompt = command.text;
    if (!userPrompt) {
        await respond({
            text: "請在指令後方輸入你想問 AI 的問題！例如：`/bot-ask 為什麼天空是藍色的？`"
        });
        return;
    }

    await respond({ text: `正在思考中... 🧠` });

    try {
        const response = await axios.post(
            "https://ai.hackclub.com/proxy/v1/chat/completions", {
                model: "tencent/hy3:free",
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            }, {
                headers: {
                    "Authorization": `Bearer ${process.env.HACK_CLUB_AI_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;

        await respond({
            text: `*問題：* ${userPrompt}\n\n*AI 回答：*\n${aiReply}`
        });

    } catch (err) {
        console.error(err);
        await respond({
            text: "呼叫 AI 時發生錯誤，請稍後再試！"
        });
    }
});

// ==================== 4. 啟動機器人 ====================
(async () => {
    await app.start();
    console.log("bot is running!");
})();