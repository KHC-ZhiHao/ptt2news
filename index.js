const axios = require('axios')
const cheerio = require('cheerio')
const { text, array } = require('power-helper')
const { ChatGPT35Broker, templates, plugins } = require('ctod')

const fetchPTTContent = async(url) => {
    let result = await axios.get(url, {
        withCredentials: true,
        headers: {
            Cookie: 'over18=1;'
        }
    })
    let html = result.data
    /**
     * @type {Array<{
     *    tag: string
     *    date: string
     *    user: string
     *    time: string
     *    message: string
     * }>}
     */
    let pushs = []
    let attrs = {
        date: 'Empty',
        title: 'Empty',
        author: 'Empty',
        category: 'Empty'
    }
    let $ = cheerio.load(html)
    let content = $('#main-content')
        .text()
        .split('※ 發信站:')[0]
        .split('\n')
        .filter(e => !text.headMatch(e.trim().toLowerCase(), 'sent'))
        .filter(e => !!e.trim())
        .slice(1, -2)
        .join('\n')
        .trim()
    let values = $('.article-meta-value')
    $('.article-meta-tag').each((index, el) => {
        if ($(el).html() === '作者') {
            attrs.author = $(values[index]).html()
        }
        if ($(el).html() === '看板') {
            attrs.category = $(values[index]).html()
        }
        if ($(el).html() === '標題') {
            attrs.title = $(values[index]).html()
        }
        if ($(el).html() === '時間') {
            attrs.date = $(values[index]).html()
        }
    })
    $('.push').each((index, el) => {
        let html = $(el).html()
        let $$ = cheerio.load(html)
        let ipdatetime = $$('.push-ipdatetime').html()
        if (ipdatetime == null || ipdatetime.trim() === '') {
            return null
        }
        let date = ipdatetime.trim().split('/').join('-').split(' ')
        let message = $$('.push-content').html().trim()
        if (message.match('http') == null) {
            pushs.push({
                tag: $$('.push-tag').html().trim(),
                user: $$('.push-userid').html().trim(),
                date: date[0],
                time: date[1],
                message: $$('.push-content').html().trim().slice(1).trim()
            })
        }
    })
    return {
        url,
        pushs,
        attrs,
        content
    }
}

/**
 * @param {{
 *    url: string
 *    style: string
 *    showLog: boolean
 *    openaiApiKey: string
 * }} params
 */

module.exports = async({ url, style, showLog, openaiApiKey }) => {
    const broker = new ChatGPT35Broker({
        plugins: showLog === false ? [] : [
            plugins.PrintLogPlugin.ver35.use()
        ],
        input: yup => {
            return {
                url: yup.string().required(),
                style: yup.string().required()
            }
        },
        output: yup => {
            return {
                focus: yup.string(),
                content: yup.string(),
                location: yup.string(),
                mainMessage: yup.string()
            }
        },
        install: ({ bot }) => {
            bot.setConfiguration(openaiApiKey)
            bot.setConfig({
                temperature: 1
            })
        },
        assembly: async({ url, style }) => {
            const { content, pushs, attrs } = await fetchPTTContent(url)
            return templates.requireJsonResponse([
                '你現在扮演一名記者，以下是一篇PTT的文章，請幫我寫一份新聞稿，請參照以下規則',
                '1. content 一定要 300字 以上',
                '2. 開頭採取大綱介紹',
                '3. 中間要有採用網友留言的部分，不太需要強調網友名稱',
                '4. 結尾要是你的個人心得，請用記者自稱而非筆者',
                '5. 整篇採用繁體中文撰寫',
                `6. 採用 ${style} 的風格撰寫`,
                '---',
                JSON.stringify({
                    date: attrs.date,
                    title: attrs.title.split(']').slice(1).join(']'),
                    forum: attrs.category,
                    content,
                    comments: array.randomPicks(8, pushs).map(push => {
                        return {
                            user: push.user,
                            message: push.message
                        }
                    })
                })
            ], {
                focus: {
                    desc: '請參照內文獲取探討重點，請勿使用標題',
                    example: 'string'
                },
                location: {
                    desc: '新聞發生地點，如果參照不出來就填「綜合」',
                    example: 'string'
                },
                mainMessage: {
                    desc: '最符合內文的網友回應',
                    example: 'string'
                },
                content: {
                    desc: '新聞內容，不低於300字',
                    example: 'string'
                }
            })
        }
    })
    const result = await broker.request({
        url,
        style
    })
    const title = `${result.focus} 網友：${result.mainMessage}`
    const reporter = `記者 -- ／${result.location}報導`
    const article = [
        '1.媒體來源:',
        '--',
        '2.記者署名:',
        reporter,
        '3.完整新聞標題:',
        title,
        '4.完整新聞內文:',
        result.content,
        '5.完整新聞連結 (或短網址)不可用YAHOO、LINE、MSN等轉載媒體:',
        url,
        '6.備註:',
        '--'
    ].join('\n\n')
    return {
        title,
        reporter,
        content: result.content,
        article
    }
}
