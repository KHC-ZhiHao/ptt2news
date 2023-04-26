# PTT To News

## Introduction

透過 ChatGPT 將 PTT 文章轉換成新聞風格。

Convert PTT article to news style by ChatGPT.

---

## How To Use

### CLI

#### Install

```bash
npm install -g ptt2news
ptt2news -k [your openai api key] -u [ptt article url] -s [news style]
```

#### Example

```bash
ptt2news -k xxxxxx -u https://www.ptt.cc/bbs/Gossiping/M.1682514675.A.296.html -s 蘋果日報
```

---

### In Process

```bash
npm install ptt2news
```

```javascript
const ptt2news = require('ptt2news')
const news = await ptt2news({
    url: 'https://www.ptt.cc/bbs/Gossiping/M.1682514675.A.296.html',
    style: '蘋果日報',
    showLog: true,
    openaiApiKey: 'xxxxxx'
})
console.log(new.article)
```
