const puppeteer = require("puppeteer"); /// import puppeteer from "puppeteer";
const fs = require('fs');
const path = require('path')



const requestParams = {
  baseURL: `http://google.com`,
  query: "",                                                   // what we want to search
  hl: "en",
  timeout_duration: 1 //mins                                                             // parameter defines the language to use for the Google maps search
};

async function scrollPage(page, scrollContainer) {
  let lastHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);

  while (true) {
    await page.evaluate(`document.querySelector("${scrollContainer}").scrollTo(0, document.querySelector("${scrollContainer}").scrollHeight)`);
    await page.waitForTimeout(5000);
    let newHeight = await page.evaluate(`document.querySelector("${scrollContainer}").scrollHeight`);
    if (newHeight === lastHeight) {
      break;
    }
    lastHeight = newHeight;
  }
}

async function fillDataFromPage(page) {
  const dataFromPage = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".bfdHYd")).map((el) => {
      return {
        shop: el.querySelector(".qBF1Pd")?.textContent.replaceAll(',','-').trim(),
        address: el.querySelector(".W4Efsd:last-child > .W4Efsd:nth-of-type(1) > span:last-child")?.textContent.replaceAll("·", "").replaceAll(",", " ").trim(),
        website: el.querySelector("a[data-value]")?.getAttribute("href"),
        phone: el.querySelector(".W4Efsd:last-child > .W4Efsd:last-child > span:last-child")?.textContent.replaceAll("·", "").replaceAll("-", "").replaceAll(/\s/g, '').replace(/\D/g, '').trim(),
      };
    });
  });
  // remove phone number which is too long, which should be an error
  const filteredData = dataFromPage.filter(function (el) {
    return el.phone.length < 15 
    && el.phone.length != 0
    && el.phone.replace(/\D/g, '').length >= 8;
  });

  return filteredData;
}

const writeFileRecursive = (file, data) => {
    const dirname = path.dirname(file);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(file, data);
  };

async function getLocalPlacesInfo() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const URL = `${requestParams.baseURL}/maps/search/${requestParams.query}?hl=${requestParams.hl}`;

  await page.setDefaultNavigationTimeout( requestParams.timeout_duration * 60000);
  await page.goto(URL);

  await page.waitForNavigation();

  const scrollContainer = ".m6QErb[aria-label]";

  const localPlacesInfo = [];

  await page.waitForTimeout(2000);
  await scrollPage(page, scrollContainer);

  localPlacesInfo.push(...(await fillDataFromPage(page)));

  await browser.close();

  return localPlacesInfo;
}

function export_data_to_file(mydata){
    console.log(mydata);
    const csvString = [
        [
          "Business Name",
          "Phone",
          "Website",
          "Address"
        ],
        ...mydata.map(item => [
          item.shop,
          item.phone,
          item.website,
          item.address
        ])
      ].map(e => e.join(",")) 
      .join("\n");
    
      const currentdate = new Date(); 
      const datetime = currentdate.getDate() + "-"
                    + (currentdate.getMonth()+1)  + "-" 
                    + currentdate.getFullYear() + "_"  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes() + ":" 
                    + currentdate.getSeconds();
    
      const filename = `${__dirname}/data/${requestParams.query.replaceAll(/\s/g, '_')}_${datetime}.csv`
      writeFileRecursive(filename,csvString)
}


var arguments = process.argv

if(arguments.length <= 2) {
    console.log('Please enter your query string');
    console.log('For example: node scrape_map.js \"florist in woodlands singapore \"');
    return;
} else
{
    if(arguments.length > 3){
        let search_string = arguments.slice(2).join(' ');
        requestParams.query = search_string        
    }else{
        requestParams.query = arguments[2]
    }

    if(requestParams.query.trim().length === 0){
        console.log('Invalid search query');
        return;
    }

    console.log('Searching : '.concat(requestParams.query))

    getLocalPlacesInfo().then(
        (data) => export_data_to_file(data)
    ).catch(
        (err) => console.log('Something wrong: '.concat(err))
    );

}


