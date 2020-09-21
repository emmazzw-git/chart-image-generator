const http = require('http');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

http.createServer(async function (req, response) {
    fs.readFile('index.html', 'utf-8', async function (err, data) {
        response.writeHead(200, { 'Content-Type': 'text/html' });

        const url = 'https://en.wikipedia.org/wiki/Women%27s_high_jump_world_record_progression';
        const resp = await axios(url);
        if (resp.data) {
            const html = resp.data; 
            const $ = cheerio.load(html);
            const wikiTableBody = $('.wikitable > tbody > tr');
            const chartData = [];
            const chartLabel = [];
            wikiTableBody.map(function (item, key) {
                // Assume we know the column heads which are height, athlete, date, place
                const numColumns = $(this).find('td').length;
                let numChild = 0;
                if (numColumns > 0) {
                    let labelstr = '';
                    for (let i = 0; i < numColumns; i++) {
                        numChild += 1;
                        const columnValue = $(this).find(`td:nth-child(${numChild})`).text();
                        if (/\d+\.\d+/.test(columnValue)) {
                            const chartHeightDatastr= columnValue.split(' ')[0];
                            const chartHeightDataPoint = parseFloat(chartHeightDatastr.substring(0, chartHeightDatastr.length - 1));
                            chartData.push(chartHeightDataPoint);
                            
                            
                        } else {
                            
                        }
                    }
                    labelstr = $(this).find('td:nth-child(3)').text();
                    chartLabel.push(labelstr);
                }
            });
            const result = data.replace('{{chartData}}', JSON.stringify(chartData)).replace('{{chartLabel}}', JSON.stringify(chartLabel));
            try {
                const browser = await puppeteer.launch();
                const page = await browser.newPage()
                await page.setContent(result, {
                    waitUntil: ["load","networkidle0"]
                });
                await page.pdf({ path: 'index.pdf', format: 'A4'})
                await browser.close();
                console.log("PDF Generated")
            } catch (err){
                console.error(err)
            };
            response.write(result);
            response.end();
        }
    });
}).listen(1337, '127.0.0.1');
console.log('Server running at http://127.0.0.1:1337/');


