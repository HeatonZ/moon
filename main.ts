import puppeteer from "npm:puppeteer-core"

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(60000)
page.on('load',async () => {
    console.log('loadd')
    const items = await page.$$('div[role=listitem]')
    items.forEach(async item => {
      const titleElement = await item.$('div[data-cy=title-recipe]')
      const title = await titleElement?.evaluate(el => el.innerText);
      const priceElement = await item.$('.a-price span')
      const price = await priceElement?.evaluate(el => el.innerText);
      console.log(title, price)
    })
})
// Navigate the page to a URL.
page.goto('https://www.amazon.sa/s?language=en&me=A325QIOE7W48AL&marketplaceID=A17E79C6D8DWNP');
console.log('????')