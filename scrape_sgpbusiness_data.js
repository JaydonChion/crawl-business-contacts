

const puppeteer = require("puppeteer"); /// import puppeteer from "puppeteer";
const fs = require('fs');
const path = require('path')

//settle later "Licensed Vet Centres",
//categories = ["Aerial Photography","Alcoholic Beverage Retailer","App Development Firm","Art Therapy Therapist","Automotive Spare Parts","Banks","Bathroom Accessories","Beverage Supplier","Bicycle Sharing Service","Boat Retailer Yacht Retailer","Building and Construction","Car Dealers","Car Polishing","Car Rental","Cleaning Services","Commercial Tanker Brokers","Company of Good Founding Members","Construction Machineries and Accessories","Copywriting","Corporate Gift","Corporate Secretarial Services","Corportate Branding","Courier Service","Coworking Space","Creative Agency","Creative Digital Agency","Cryptocurrencies","Dance School","Debt Recovery","Delivery Services","Destination Management Company","Digital Management Consulting Firm","Disposable Products","Domain Registrar","Drones","eCommerce Fulfilment Company","Education Company or Consultancy","Electrical Services","Electricity Market Support Services","Electricity Retailer","Electricity Transmission Company or Agent","Electricity Wholesaler Demand Side Participation","Electricity Wholesaler Generation","Employment Agencies","Energy Generation Companies","Energy Market Company","Engineering Firms","Event Organiser Management","Exhibition Booth Designer and Contractors","Factoring Companies","Feng Shui and Geomancy","Financing Companies","Fintech","Fire Protection","Food Caterer","Food Caterer Halal-Certified","Food Packaging","Food Service Distributor","Freight Forwarding","Funeral Parlour","Furniture Company","Graphics Designer","Handicraft and Flowers","Handyman","Hardware Stores","HDB Household Shelter Door Repairs Contractor","Helicopter Operators","Home Automation","Home Cleaning","Home Furnishing","Home Meals Delivery","Hotels","House Maid Agency","Human Resource","Industrial Gas Supplier","Insurance","Interior Contractor","Interior Design","Interior Design Commercial","International Relocation Companies","IT and Network Infrastructure","Law Firm","Legal Services","Licensed Moneylender","Limousine Service","Locker Alliance Network","Logistic Management","Luggage Repair","Machine Learning","Marine Equipment","Media Agency","Money Broker","Money-Changing Services","Motor Financing","Motor Insurance","Motor Service and Bodywork Centre","Motorcycle Dealer","Music Schools","Online Advertising","Online Bakery","Packaging Supplier","Payment Solutions","Personalised Rubber Stamps","Pest Control Services","Photographers","Plumbing Services","POS System","PR and Communications Consultancy","Printing Services","Private Investigators","Procurement Services","Professional Make-up Artist","Professional Movers","Property and Lease Management","Property Management Services","Recovery and Recycling","Remittance Services","Restaurants","Retail Solutions","Robotics","Scaffolding","Schools","SEO Firms","SingapoRediscovers Vouchers Eligible Merchants","SMS Provider","Software Security Testing","Spa and Massage Therapy","Top 10 Singapore Property Developers","Township Management Services","Translation Services","Travel Sites","Tuition Agencies","Tuition Centre","Umbrella","Urban Farm","Used Car Dealers","Venture Capital Firms","Video Analytics","Video Production","Warehousing and Delivery","Waste Removal","Wealth and Estate Planning","Web Design Firm","Web Development","Web Hosting Services","Wedding Boutique","Wedding Cars Rental","Yacht Chartering"]

//categories from https://www.sgpbusiness.com/category
const requestParams = {
  baseURL: `https://www.sgpbusiness.com/category`,
  query: "Cryptocurrencies",                                                   // what we want to search
  hl: "en",
  timeout_duration: 1 //mins                                                             // parameter defines the language to use for the Google maps search
};


async function fillDataFromPage(page) {
  const dataFromPage = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".media")).map((el) => {

      return {
        shop: el.querySelector("h6")?.textContent.replaceAll(',','-').trim(),
        phone: Array.from(el.querySelectorAll("small > span")).filter(element => element.textContent.startsWith('+65')).map( item => item.textContent.replaceAll('-','').replaceAll('+','').trim()).join(" | "),
        website: Array.from(el.querySelectorAll("small > span")).find(element => element.textContent.includes('www') || element.textContent.includes('.com') || element.textContent.includes('.sg'))?.textContent.replaceAll('-','').replaceAll('+','').trim(),
        address: el.querySelectorAll("small > span")[0].textContent
      };
    });
  });
  // remove phone number which is too long, which should be an error
  const filteredData = dataFromPage.filter(function (el) {
    return el.phone.length > 5;
  });
  
  return filteredData;
}


async function getBusinessInfo() {

  const localPlacesInfo = [];

  for(let i =0; i < categories.length; i++){
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    let catjoin = categories[i].replaceAll(" " , "-")
    const URL = `${requestParams.baseURL}/${catjoin}`;

    await page.setDefaultNavigationTimeout( requestParams.timeout_duration * 60000);
    await page.goto(URL);

    // await page.waitForNavigation();

    // const scrollContainer = ".m6QErb[aria-label]";

    

    await page.waitForTimeout(10000);
    // await scrollPage(page, scrollContainer);

    let result = Array.from(await fillDataFromPage(page,categories[i]));

    result.forEach(
      (item)=>item.category = categories[i]
    )

    localPlacesInfo.push(...(result));
    await browser.close();
  }

  

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
        "Category",
        "Business Name",
        "Phone",
        "Website",
        "Address"
      ],
      ...mydata.map(item => [
        item.category,
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
  
    const filename = `${__dirname}/data/${datetime}.csv`
    writeFileRecursive(filename,csvString)
}


getBusinessInfo().then(
  (data) => {
    console.log(data);
    export_data_to_file(data);
  }
)
