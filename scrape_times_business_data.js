

const puppeteer = require("puppeteer"); /// import puppeteer from "puppeteer";
const fs = require('fs');
const path = require('path')

const requestParams = {
  baseURL: `https://www.timesbusinessdirectory.com/company-listings?page=`,
  start: 501,
  end: 888,
  hl: "en",
  timeout_duration: 1 //mins                                                             // parameter defines the language to use for the Google maps search
};


async function fillDataFromPage(page) {
  const dataFromPage = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".company-details")).map((el) => {
      let shop_name = el.querySelector("h3 > a")?.textContent.replaceAll(',','-').replace(/['‘’"“”]/g, '').trim();
      let p_tag = el.querySelectorAll("p")
      let detail = p_tag[0].textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/['‘’"“”]/g, '').trim()
      if(shop_name === undefined || shop_name === null || shop_name.length === 0){
        shop_name = p_tag[0].textContent.replaceAll(',','-').replace(/['‘’"“”]/g, '').trim()
        detail = p_tag[1].textContent.replace(/(\r\n|\n|\r)/gm, "").replace(/['‘’"“”]/g, '').trim()
      }
      return {
        shop: shop_name,
        phone: el.querySelector('[id^="valuephone_"] > a')?.textContent.split("(65)").map((item) => "65"+item.replace("(65)","65").replace(/(\r\n|\n|\r)/gm, "").replaceAll(" ","")).filter((item)=>item.length > 3).join("|").trim() || "",
        // .filter((item)=>item.length > 3).map((item) => item.replace("(65)","65").replaceAll(" ","")).join("|").trim()
        // phone: el.querySelector('[id^="valuephone_"] > a')?.textContent.replaceAll("(","").replaceAll(")","").replaceAll(" ","").trim(),
        website: el.querySelector('[id^="valuewebsite_"] > a')?.textContent.replace(/['‘’"“”]/g, '').trim() || "",
        detail:  detail || "",
      };
    });
  });
  // remove phone number which is too long, which should be an error
  // const filteredData = dataFromPage.filter(function (el) {
  //   return el.phone.length > 5;
  // });
  
  // return filteredData;
  return dataFromPage;
}


async function getBusinessInfo() {

  const localPlacesInfo = [];
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  for(let i =requestParams.start; i <= requestParams.end; i++){
        
    const URL = `${requestParams.baseURL}${i}`;

    await page.setDefaultNavigationTimeout( requestParams.timeout_duration * 60000);
    await page.goto(URL);

    // await page.waitForNavigation();

    // const scrollContainer = ".m6QErb[aria-label]";

    
    await page.waitForSelector('.company-details', { timeout: 20000 });

    // await page.waitForTimeout(10000);
    // await scrollPage(page, scrollContainer);

    let result = Array.from(await fillDataFromPage(page));

    localPlacesInfo.push(...(result));
    
  }
  await browser.close();
  
  return localPlacesInfo;
}

const writeFileRecursive = (file, data) => {
  const dirname = path.dirname(file);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  fs.writeFileSync(file, data);
};

function export_data_to_file(mydata){
  console.log(mydata);
  const csvString = [
      [
        "Business Name",
        "Phone",
        "Website",
        "Detail"
      ],
      ...mydata.map(item => [
        item.shop,
        item.phone,
        item.website,
        item.detail
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
  
    const filename = `${__dirname}/data/times_business_p${requestParams.start}_to_p${requestParams.end}_${datetime}.csv`
    writeFileRecursive(filename,csvString)
}


getBusinessInfo().then(
  (data) => {
    // console.log(data.length);
    export_data_to_file(data);
  }
)
