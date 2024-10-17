import time
import agentql
from playwright.sync_api import sync_playwright

# Initialize the browser
with sync_playwright() as playwright, playwright.chromium.launch(headless=False) as browser:
    page = agentql.wrap(browser.new_page())
    
    # Navigate to the Florida Courts E-Filing Portal
    page.goto("https://www.myflcourtaccess.com/default.aspx")
    