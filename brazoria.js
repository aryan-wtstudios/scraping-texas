const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const fs = require("node:fs");
const { supabase } = require("./utils");

puppeteer
  .use(StealthPlugin())
  .launch({ headless: false })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto(
      "https://pubweb.brazoriacountytx.gov/PublicAccess/default.aspx"
    );

    await page.waitForSelector(
      "a.ssSearchHyperlink[href=\"javascript:LaunchSearch('Search.aspx?ID=200', false, true, sbxControlID2)\"]"
    );
    await page.click(
      "a.ssSearchHyperlink[href=\"javascript:LaunchSearch('Search.aspx?ID=200', false, true, sbxControlID2)\"]"
    );

    
    await page.waitForSelector("#CaseSearchValue");
    await page.type("#CaseSearchValue", "FEV23-399");

    await page.click(
      'input[type="submit"][name="SearchSubmit"][value="Search"]'
    );

    const caseLinkSelector = 'a[href^="CaseDetail.aspx?CaseID="]';
    await page.waitForSelector(caseLinkSelector);
    const caseDetailUrl = await page.evaluate((selector) => {
      return document.querySelector(selector).getAttribute("href");
    }, caseLinkSelector);
    await page.goto(`https://judicialrecords.wilco.org/${caseDetailUrl}`);

    await page.waitForNetworkIdle();
    const allPageData = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).reduce((acc, el) => {
        if (el.offsetHeight > 0 && el.offsetWidth > 0) {
          acc[el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ').join('.') : '')] = el.innerText;
        }
        return acc;
      }, {});
    });
    const pageDataString = JSON.stringify(allPageData);

    const { data, error } = await supabase
      .from('case_details')
      .insert([
        { case_id: "FEV23-399", county: 'Brazoria', raw_data: pageDataString }
      ]);

    if (error) {
      console.error('Error inserting data into Supabase:', error);
    } else {
      console.log('Data inserted successfully:', data);
    }


    // Extract all th and td data inside tr from the specified table
    // const tableData = await page.evaluate(() => {
    //   const rows = document.querySelectorAll(
    //     'table[style="table-layout:fixed;"] tr'
    //   );
    //   return Array.from(rows).map((row) => {
    //     const cells = row.querySelectorAll("th, td");
    //     return Array.from(cells).map((cell) =>
    //       cell.innerText
    //         .trim()
    //         .replaceAll(",", " ")
    //         .replaceAll(";", " ")
    //         .replaceAll(/\s+/g, " ")
    //     );
    //   });
    // });

    // const structuredData = {};
    // tableData.forEach((row) => {
    //   const date = row.find((cell) => /\d{2}\/\d{2}\/\d{4}/.test(cell));
    //   const text = row.find(
    //     (cell) => cell && !/\d{2}\/\d{2}\/\d{4}/.test(cell)
    //   );

    //   if (date && text) {
    //     if (!structuredData[text]) {
    //       structuredData[text] = [];
    //     }
    //     structuredData[text].push(date);
    //   }
    // });

    // // Convert structured data to CSV
    // function structuredDataToCSV(data) {
    //   const headers = Object.keys(data);
    //   const csvRows = [headers.join(",")]; // First row as headers

    //   // Find the longest array of dates
    //   const maxLength = Math.max(
    //     ...Object.values(data).map((dates) => dates.length)
    //   );

    //   // Fill in the CSV rows
    //   for (let i = 0; i < maxLength; i++) {
    //     const row = headers.map((header) => data[header][i] || "");
    //     csvRows.push(row.join(","));
    //   }

    //   return csvRows.join("\n");
    // }

    // const csvData = structuredDataToCSV(structuredData);

    // fs.writeFile("brazoria.csv", csvData, (err) => {
    //   if (err) {
    //     console.error("Error writing to CSV file", err);
    //   } else {
    //     console.log("Successfully wrote to CSV file");
    //   }
    // });
  });
