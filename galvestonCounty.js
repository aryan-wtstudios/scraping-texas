const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("fs");
const { supabase } = require('./utils');

let caseids = ["24-EV02-0150"];


puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "2f06348d19c57f973aa82aeecb95b3d7", // Replace with your actual 2Captcha API key
    },
    visualFeedback: true,
  })
);


for (let i = 0; i < caseids.length; i++) {

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(
      "https://portal.galvestoncountytx.gov/Portal/Home/Dashboard/29"
    );

    await page.solveRecaptchas();
    await page.type("#caseCriteria_SearchCriteria", caseids[i]);
    await page.waitForSelector('input[type="submit"][value="Submit"]');
    await page.click('input[type="submit"][value="Submit"]');
    await page.waitForNavigation();

    const caseLinkSelector = 'a.caseLink[data-caseid="0"]';
    const targetUrl = await page.$eval(caseLinkSelector, (el) =>
      el.getAttribute("data-url")
    );
    await page.goto(targetUrl);

    // await page.waitForSelector("#divCaseInformation_body");
      await page.waitForNetworkIdle();
    const allPageData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("*")).reduce((acc, el) => {
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          acc[
            el.tagName +
              (el.id ? "#" + el.id : "") +
              (el.className ? "." + el.className.split(" ").join(".") : "")
          ] = el.innerText;
        }
        return acc;
      }, {});
    });
    const pageDataString = JSON.stringify(allPageData);

    const { data, error } = await supabase
      .from("case_details")
      .insert([
        { case_id: caseids[i], county: "galveston", raw_data: pageDataString },
      ]);

    if (error) {
      console.error("Error inserting data into Supabase:", error);
    } else {
      console.log("Data inserted successfully:", data);
    }

    // Close the browser after all operations are done
    await browser.close();


    // const caseInformation = await page.evaluate(() => {
    //   const info = {};
    //   const caseNumber = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(1) p"
    //     )
    //     .innerText.split("\n")[1];
    //   const court = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(2) p"
    //     )
    //     .innerText.split("\n")[1];
    //   const judicialOfficer = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(3) .col-md-4:nth-child(3) p"
    //     )
    //     .innerText.split("\n")[1];
    //   const fileDate = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(1) p"
    //     )
    //     .innerText.split("\n")[1];
    //   const caseType = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(2) p"
    //     )
    //     .innerText.split("\n")[1];
    //   const caseStatus = document
    //     .querySelector(
    //       "#divCaseInformation_body .row:nth-child(4) .col-md-4:nth-child(3) p"
    //     )
    //     .innerText.split("\n")[1];

    //   info["Case Number"] = caseNumber;
    //   info["Court"] = court;
    //   info["Judicial Officer"] = judicialOfficer;
    //   info["File Date"] = fileDate;
    //   info["Case Type"] = caseType;
    //   info["Case Status"] = caseStatus;

    //   return info;
    // });

    // console.log(caseInformation);
  })
  .catch((err) => console.error(err));


}
