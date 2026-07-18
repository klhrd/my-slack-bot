# My Slack Bot

![screenshot](./public/screenshot.png)

This bot is a deep word utility that hooks into the Free Dictionary API and the Datamuse API to pull definitions, syllables, synonyms, and even old word origins right into Slack.

## FEATURES

There are 4 commends:

### `/bot-word <word>`
- Quick dictionary definitions
- Phonetic pronunciations
- Usage examples

### `/bot-thesaurus <word>`
- Synonyms and Antonyms

### `/bot-etymology <word>`
- Traces historical origins (like Latin and Greek roots) from Wiktionary

### `/bot-help <word>`
- Commends-list

## SETUP

If you want to host this yourself:

1. clone repo & install
```bash
# clone repo
git clone https://github.com/klhrd/my-slack-bot
cd my-slack-bot

npm install
```

2. set environment variables

create a `.env` file in the root directory
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

3. run the bot
```bash
node index.js

```