const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("fs"); 

// Import the supabase client from utils.js
const { supabase } = require('./utils');


puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "2f06348d19c57f973aa82aeecb95b3d7", // Replace with your actual 2Captcha API key
    },
    visualFeedback: true,
  })
);

const caseId = "31E2400684"; // Assuming caseId is known or extracted previously
const county = "Bexar";

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(
      "https://portal-txbexar.tylertech.cloud/Portal/Home/Dashboard/29"
    );

    await page.solveRecaptchas();
    await page.type("#caseCriteria_SearchCriteria", caseId);
    await page.waitForSelector('input[type="submit"][value="Submit"]');
    await page.click('input[type="submit"][value="Submit"]');
    await page.waitForNavigation();

    // Use waitForSelector to ensure the element is loaded
    const selector =
      "#CasesGrid > table > tbody > tr.k-master-row > td.card-heading.party-case-caseid.owa-break-all a";
    await page.waitForSelector(selector);

    const targetUrl = await page.evaluate(() => {
      const link = document.querySelector(
        "#CasesGrid > table > tbody > tr.k-master-row > td.card-heading.party-case-caseid.owa-break-all a"
      ); // Use the appropriate selector to target the link
      return link.getAttribute("data-url"); // Extract the URL from the data-url attribute
    });

    // Assuming the base URL of the page is known and the extracted URL is a relative path
    const baseUrl = "https://portal-txbexar.tylertech.cloud/"; // Replace with the actual base URL of the site
    await page.goto(`${baseUrl}${targetUrl}`);
    

    // await page.screenshot({ path: "error-screenshot.png" });
    // await page.waitForSelector(
    //   "#roa-content > div:nth-child(5) > section > md-card > md-card-content > ng-include > div > div:nth-child(4) > div > div > ng-include > div > div.roa-inline.roa-align-top.roa-event-date-col.ng-scope > div > span"
    // );

    await page.waitForNetworkIdle();

    const dynamicData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).reduce((acc, el) => {
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          acc[el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')] = el.innerText;
        }
        return acc;
      }, {});
    });
    const htmlContent = JSON.stringify(dynamicData);
    

    

    // Push the data to the supabase rawdata table
    const { data, error } = await supabase
      .from('rawdata')
      .insert([
        { case_id: caseId, county: county, raw_data: htmlContent }
      ]);

    if (error) {
      console.error('Error inserting data into Supabase:', error);
    } else {
      console.log('Data inserted successfully:', data);
    }

    // let case_status =  await page.evaluate(() => {
    //   let case_date = document.querySelector(
    //     "#roa-content > div:nth-child(2) > section > md-card > md-card-content > ng-include > div:nth-child(1) > ng-include > div > table > tbody > tr:nth-child(2) > td.roa-value > div > div > span:nth-child(1)"
    //   ).innerText
    //   return case_date
    // })

    // // TODO: trial date is changing maybe have to reconsider
    // // await page.waitForSelector("#Event_132411555 > div > span", {
    // //   timeout: 60000,
    // // });
    // // let trial_date = await page.evaluate(() => {
    // //   let trial = document.querySelector(
    // //     "#Event_132411555 > div > span"
    // //   ).innerText;
    // //   return trial;
    // // });
    
    // let judicial_date = await page.evaluate(() => {
    //   let trial = document.querySelector(
    //     "#roa-content > div:nth-child(5) > section > md-card > md-card-content > ng-include > div > div:nth-child(2) > div > div > ng-include > div > div.roa-inline.roa-align-top.roa-event-date-col.ng-scope > div > span"
    //   );
    //   console.log("🚀 ~ letjudicial_date=awaitpage.evaluate ~ trial:", trial)
    //   if (trial) return trial.innerHTML
    //   return "";
    // });
    // let citation_date = await page.evaluate(() => {
    //   let ans = document.querySelector(
    //     "#roa-content > div:nth-child(5) > section > md-card > md-card-content > ng-include > div > div.roa-pad-0.roa-event-info.ng-scope.roa-event-info-service-event > div > div > ng-include > div > div.roa-inline.roa-align-top.roa-event-date-col.ng-scope > div > span"
    //   )
    //   console.log("🚀 ~ letcitation_date=awaitpage.evaluate ~ ans:", ans)
    //   if (ans) return ans.innerHTML
    //   return "";
    // });
    // let petition_date = await page.evaluate(() => {
    //   let asn = document.querySelector(
    //     "#roa-content > div:nth-child(5) > section > md-card > md-card-content > ng-include > div > div:nth-child(4) > div > div > ng-include > div > div.roa-inline.roa-align-top.roa-event-date-col.ng-scope > div > span"
    //   )
    //   console.log("🚀 ~ letpetition_date=awaitpage.evaluate ~ asn:", asn)
    //   if (asn) return asn.innerHTML
    //   return "";
    // });
    // let complaint_date = await page.evaluate(() => {
    //   let asn = document.querySelector(
    //     "#roa-content > div:nth-child(5) > section > md-card > md-card-content > ng-include > div > div:nth-child(7) > div > div > ng-include > div > div.roa-inline.roa-align-top.roa-event-date-col.ng-scope > div > span"
    //   )
    //   console.log("🚀 ~ letcomplaint_date=awaitpage.evaluate ~ asn:", asn)
    //   if (asn) return asn.innerHTML
    //   return "";
    // });
    // const csvContent = `case_date,JUDICIAL_DATE,CITATION_DATE,PETITION_DATE,COMPLAINT_DATE\n${case_status},${judicial_date},${citation_date},${petition_date},${complaint_date}`;

    // // Write the CSV string to a file
    // fs.writeFile("bexar.csv", csvContent, (err) => {
    //   if (err) {
    //     console.error("Error writing to CSV file", err);
    //   } else {
    //     console.log("Successfully wrote dates to dates.csv");
    //   }
    // });
  })
  .catch((err) => console.error(err));
