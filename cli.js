#!/usr/bin/env node

const ptt2news = require('./index')
const { flow } = require('power-helper')
const { prompt } = require('inquirer')
const { program } = require('commander')

program
    .option('-k, --key <v>', 'Your openai key.')
    .option('-u, --url <v>', 'The url of the article.')
    .option('-s, --style <v>', 'The style of the article.')
    .option('-l, --log ', 'Show log.')
    .parse()

flow.run(async() => {
    let { key, url, style, log } = program.opts()
    if (!key) {
        key = await prompt([
            {
                type: 'input',
                name: 'key',
                message: '請貼上 openai api key',
                validate: value => {
                    return !!value
                }
            }
        ]).then(({ key }) => key)
    }
    if (!url) {
        url = await prompt([
            {
                type: 'input',
                name: 'url',
                message: '貼上文章網址',
                validate: value => {
                    return value.match('https://www.ptt.cc/bbs/') != null
                }
            }
        ]).then(({ url }) => url)
    }
    if (!style) {
        style = await prompt([
            {
                type: 'input',
                name: 'style',
                message: '新聞風格',
                default: '蘋果日報',
                validate: value => {
                    return !!value
                }
            }
        ]).then(({ style }) => style)
    }
    const result = await ptt2news({
        url,
        style,
        showLog: !!log,
        openaiApiKey: key
    })
    console.log(result.article)
})
