import puppeteer from "npm:puppeteer-core"
import EXCEL from "npm:exceljs"
import { Buffer } from "node:buffer";
import * as _ from "npm:lodash";

/**
 * asin
 * 标题
 * 商家
 * 类型 FBA/自发货
 * 价格
 * 库存
 * 采集日期
 * 采集时间
 * 图片
 * 品牌
 * 尺寸信息
 * 品类一
 * 排名
 * 品类二
 * 排名
 * 评分
 * 评分数
 */
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
});
const page = await browser.newPage();
const timeout = 90000
page.setDefaultNavigationTimeout(90000)
page.setDefaultTimeout(90000)
const getValue = async (element: any, key: string) => {
  return await element?.evaluate((el: any) => _.get(el, key))
}
const handleOnePage = async (page:puppeteer.Page) => {
  await page.waitForSelector('div[role=listitem]', {timeout})
  const items = await page.$$('div[role=listitem]')
    
  const res = await Promise.all(items.map(async item => {
    const titleElement = await item.$('div[data-cy=title-recipe]')
    const title = await titleElement?.evaluate(el => el.innerText);
    const linkElement = await titleElement?.$('a')
    const link = await linkElement?.evaluate(el => el.href)
    const asin = link?.match(/(?<=dp\/).*(?=\/)/)?.[0]
    const priceElement = await item.$('.a-price span')
    const price = await priceElement?.evaluate(el => el.innerText);
    const imageElement = await item.$('.s-image')
    const src  = await imageElement?.evaluate(el => el.src)
    let image
    if(src){
      console.log(src)
      // await page.waitForResponse(src)
      try {
        image = await imageElement?.screenshot()
      } catch (error) {
        image = []
      }
    }
    const res = {
      asin,
      title,
      price,
      image
    }
    const values = await handleOneItem(link)
    return {
      ...res,
      ...values
    }
  }))
  console.log(res, res.length)
  return res
}
const handleOneItem = async (link:string) => {
  const p = await browser.newPage()
  p.setDefaultNavigationTimeout(90000)
  p.setDefaultTimeout(90000)
  await p.goto(link, { waitUntil: 'load' })
  await p.waitForSelector('span[id=productTitle]')
  const title = await (await p.$('span[id=productTitle]'))?.evaluate(el => el.innerText)
  const price = await getValue(await p.$('.a-offscreen'), 'innerText')
  const merchant = await getValue(await p.$('*[data-csa-c-slot-id=odf-feature-text-desktop-merchant-info]'), 'innerText')
  const brand = await getValue(await p.$('.po-brand td:nth-child(2)'), 'innerText')
  const size = await getValue(await p.$('.a-cardui-body .inline-twister-dim-title-value-truncate'), 'innerText')
  const res = {
    title,
    price,
    merchant,
    brand,
    size
  }
  await p.close()
  return res
}
// Navigate the page to a URL.
await page.goto('https://www.amazon.sa/s?language=en&me=A325QIOE7W48AL&marketplaceID=A17E79C6D8DWNP', {
  waitUntil: [
    'load',
    'domcontentloaded'
  ]
});

console.log('loadd')
let res = await handleOnePage(page)
let next = await page.$('.s-pagination-next')
while(next && !(await next.evaluate((el) => el.className)).includes('s-pagination-disabled')){
  await Promise.all([
    next.click(),
    page.waitForNavigation()
  ]);
  res = res.concat(await handleOnePage(page))
  next = await page.$('.s-pagination-next')
}
const book = new EXCEL.Workbook()
const sheet = book.addWorksheet('1')
res.forEach((item, index) => {
  sheet.addRow([
    '',
    item.title,
    item.price
  ])
  const imageId = book.addImage({
    buffer: Buffer.from(item.image!),
    extension: 'jpeg', // 图片的扩展名
  });
  // 自动调整单元格大小
  const columnIndex = 1; // B列
  const rowIndex = index + 1; // 第2行
  const imageWidth = 300; // 图片宽度
  const imageHeight = 300; // 图片高度
  sheet.addImage(imageId, {
    tl: {
      row: rowIndex - 1,
      col: columnIndex-1
    },
    ext: {
      width: imageWidth,
      height: imageHeight
    }
  })


  // Excel 列宽单位为字符宽度，约为 7.5 像素
  const columnWidth = imageWidth / 7.5;
  sheet.getColumn(columnIndex).width = columnWidth;

  // Excel 行高单位为像素
  const rowHeight = imageHeight * 0.75; // 行高单位换算
  sheet.getRow(rowIndex).height = rowHeight;
})
page.close()
browser.close()
console.log('????')
