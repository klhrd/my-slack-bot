require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});

// ==================== 1. Help Command ====================

app.command("/bot-help", async ({ ack, respond }) => {
    await ack();
    await respond({
        text: `🤖 *Ryder's Advanced Lexicon Explorer* 🤖\n\n` +
              `This bot is dedicated to deep English word analysis. No fluff, just pure linguistic data.\n\n` +
              `*Usage:*\n` +
              `• \`/bot-word [word]\` - Deep query using default 'all' mode.\n` +
              `• \`/bot-word [word] thesaurus\` - Focus on synonyms, antonyms, and derived/related words.\n` +
              `• \`/bot-word [word] etymology\` - Focus on etymology and historical roots.\n` +
              `• \`/bot-help\` - Show this guide.`
    });
});

// ==================== 2. Lexicon Explorer Tool ====================

app.command("/bot-word", async ({ command, ack, respond }) => {
    await ack();

    // 解析輸入，支援格式: "/bot-word ephemeral" 或 "/bot-word ephemeral etymology"
    const inputParts = command.text ? command.text.trim().split(/\s+/) : [];
    const targetWord = inputParts[0] ? inputParts[0].toLowerCase() : "";
    
    // 預設模式為 'all'，可選 'thesaurus' 或 'etymology'
    let mode = inputParts[1] ? inputParts[1].toLowerCase() : "all";
    if (!["all", "thesaurus", "etymology"].includes(mode)) {
        mode = "all"; 
    }

    if (!targetWord) {
        await respond({
            text: "Please provide a word! Example: \`/bot-word persistent\` or \`/bot-word persistent etymology\`"
        });
        return;
    }

    await respond({ text: `Analyzing *"${targetWord}"* in \`${mode}\` mode... 🔍` });

    try {
        // 1. 同步向 Dictionary API 與 Datamuse API 發送多重請求
        const dictPromise = axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${targetWord}`).catch(() => null);
        
        // Datamuse 相關 API：同義(syn)、反義(ant)、相關/派生(jja/jjb/trg)
        const synPromise = axios.get(`https://api.datamuse.com/words?rel_syn=${targetWord}&max=8`).catch(() => ({ data: [] }));
        const antPromise = axios.get(`https://api.datamuse.com/words?rel_ant=${targetWord}&max=8`).catch(() => ({ data: [] }));
        const relPromise = axios.get(`https://api.datamuse.com/words?rel_trg=${targetWord}&max=8`).catch(() => ({ data: [] })); // 相關聯想詞
        const derivedPromise = axios.get(`https://api.datamuse.com/words?rel_cns=${targetWord}&max=8`).catch(() => ({ data: [] })); // 派生/修飾詞

        const [dictRes, synRes, antRes, relRes, derivedRes] = await Promise.all([
            dictPromise, synPromise, antPromise, relPromise, derivedPromise
        ]);

        // 2. 提取基本字典資料 (釋義、音標、例句、字源)
        let phonetic = "";
        let definitionText = "_No definitions found._";
        let exampleText = "_No examples found._";
        let etymologyText = "No direct etymology info found in Wiktionary database.";

        if (dictRes && dictRes.data && dictRes.data[0]) {
            const wordData = dictRes.data[0];
            phonetic = wordData.phonetic ? ` \`[${wordData.phonetic}]\`` : "";
            
            // 讀取釋義與例句
            const meaningsList = [];
            const examplesList = [];
            
            wordData.meanings.forEach(m => {
                const defObj = m.definitions[0];
                if (defObj) {
                    meaningsList.push(`• *(${m.partOfSpeech})* ${defObj.definition}`);
                    if (defObj.example) {
                        examplesList.push(`• *(${m.partOfSpeech})* "${defObj.example}"`);
                    }
                }
            });

            if (meaningsList.length > 0) definitionText = meaningsList.slice(0, 3).join("\n");
            if (examplesList.length > 0) exampleText = examplesList.slice(0, 3).join("\n");
            
            // 提取 Free Dictionary (Wiktionary) 中的 etymology 欄位 (部分單字含有)
            if (wordData.etymology) {
                etymologyText = wordData.etymology;
            } else if (wordData.origin) {
                etymologyText = wordData.origin; // 舊版或部分資料庫使用 origin 欄位
            }
        }

        // 3. 提取關係詞與同反義
        const formatWordList = (res) => (res && res.data && res.data.length > 0) 
            ? res.data.map(w => `\`${w.word}\``).join(", ") 
            : "None";

        const synonyms = formatWordList(synRes);
        const antonyms = formatWordList(antRes);
        const relatedWords = formatWordList(relRes);
        const derivedWords = formatWordList(derivedRes);

        // 4. 根據不同的模式 (Mode) 組合 Slack Blocks
        const blocks = [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `📖 *Word Explorer:* *"${targetWord}"*${phonetic} \nMode: \`${mode.toUpperCase()}\``
                }
            },
            {
                type: "divider"
            }
        ];

        // 模式 A: All Mode (完整基本資訊)
        if (mode === "all") {
            blocks.push(
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Definitions (基本釋義):*\n${definitionText}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Examples (例句):*\n${exampleText}`
                    }
                },
                {
                    type: "section",
                    fields: [
                        { type: "mrkdwn", text: `*Synonyms (同義):*\n${synonyms}` },
                        { type: "mrkdwn", text: `*Antonyms (反義):*\n${antonyms}` }
                    ]
                }
            );
        }

        // 模式 B: Thesaurus Mode (同反、派生、相關詞)
        if (mode === "thesaurus") {
            blocks.push(
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Synonyms (同義詞):*\n${synonyms}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Antonyms (反義詞):*\n${antonyms}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Derived / Consonant Words (派生詞/同諧音修飾詞):*\n${derivedWords}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Related Words (相關聯想詞):*\n${relatedWords}`
                    }
                }
            );
        }

        // 模式 C: Etymology Mode (字源追溯)
        if (mode === "etymology") {
            // 字源追溯：如果字典沒提供，則搭配 Datamuse 的同字根或同源線索
            blocks.push(
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Etymology & Origin (字源追溯):*\n\n> ${etymologyText}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*Morphologically Related Words (同字根/同源衍生字詞):*\n${relatedWords}`
                    }
                }
            );
        }

        // 發送最終結構化 Block 卡片到 Slack
        await respond({ blocks });

    } catch (err) {
        console.error(err);
        await respond({
            text: `Failed to fetch linguistic data for *"${targetWord}"*. Please verify your spelling.`
        });
    }
});

// ==================== 3. Start Bot ====================
(async () => {
    await app.start();
    console.log("bot is running!");
})();