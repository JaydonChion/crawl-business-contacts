1. Install homebrew by following the guide in  (https://brew.sh/)

2. brew install node

3. go to the source code folder (cd </path/to/code>

4. npm install

5. node scrape_map.js <query string>
   e.g : node scrape_map.js florist in woodlands singapore

6. A chrome browser will be opened and run automatically. Wait for it to complete.

7. ** Do note that currently the program will only run for 1 minute, if want to run longer, open "scrape_map.js", go to line 11 (timeout_duration: 1 ) and change the value to higher value, e.g 5 to run for 5 minutes.

8. check the saved result in data folder

-------------------------------------------

crawl sgpbusiness (https://www.sgpbusiness.com/)

node scrape_sgpbusiness_data.js


-------------------------------------------

crawl times business directory (https://www.timesbusinessdirectory.com/)

node scrape_times_business_data.js
