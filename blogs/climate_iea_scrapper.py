import requests
from bs4 import BeautifulSoup
import time
import pandas as pd

# The list of links to the reports
links_list = []

# Get the data from https://www.iea.org/analysis?type=report from page 0 to 63
for page in range(0, 1):
    url = 'https://www.iea.org/analysis?type=report&page='
    url = url + str(page)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    links = soup.find_all('a', href=True)
    links = [link['href'] for link in links if link['href'].startswith('/reports/')]
    links = list(set(links))
    links_list.extend(links)

# dataframe to store report data
df = pd.DataFrame(columns=['title', 'date', 'summary', 'external_link', 'pdf_link', 'report_type'])

# Get the data from each report
for report_url in links_list:
    try:
        url = 'https://www.iea.org' + report_url
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')

        # title
        title = soup.find('title').text

        # date
        published_label = soup.find('span', class_='m-meta-infos__item-label', string='Published')
        date = published_label.find_next_sibling('span', class_='m-meta-infos__item-value').text
        
        # summary
        div = soup.find('div', class_='m-report-abstract__desc f-rte')
        summary = div.get_text(separator=' ', strip=True)
        
        # external_link
        external_link = url

        # pdf_link
        pdf_link_tag = soup.find('a', href=lambda x: x and x.endswith('.pdf'))
        pdf_link = pdf_link_tag['href'] if pdf_link_tag else None

        # return a row
        row = pd.DataFrame({'title': [title], 'date': [date], 'summary': [summary], 'external_link': [external_link], 'pdf_link': [pdf_link]})

        # append the row to the dataframe
        df = pd.concat([df, row], ignore_index=True)
        
        time.sleep(1)

    except Exception as e:
        print(f"Error occurred while processing report {report_url}: {e}")
        continue

# download pdf files
for index, row in df.iterrows():
    if row['pdf_link']:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(row['pdf_link'], headers=headers)
        name = row['title'].replace('/', '_')
        with open(f"{name}.pdf", 'wb') as f:
            f.write(response.content)
        time.sleep(1)

# save the dataframe
df.to_csv('climate_scrapper_iea.csv', index=False)