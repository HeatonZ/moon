import puppeteer from "npm:puppeteer-core"

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
});
const page = await browser.newPage();
page.setDefaultNavigationTimeout(60000)
page.on('load',async () => {
    console.log('loadd')
    const items = await page.$$('div[role=listitem]')
    
    const res = await Promise.all(items.map(async item => {
      const titleElement = await item.$('div[data-cy=title-recipe]')
      const title = await titleElement?.evaluate(el => el.innerText);
      const priceElement = await item.$('.a-price span')
      const price = await priceElement?.evaluate(el => el.innerText);
      console.log(title, price)
      return {
        title,
        price
      }
    }))
    console.log(res)
    page.close()
    browser.close()
})
// Navigate the page to a URL.
page.goto('https://www.amazon.sa/s?language=en&me=A325QIOE7W48AL&marketplaceID=A17E79C6D8DWNP');
console.log('????')