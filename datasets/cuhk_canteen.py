# Import necessary libraries
from bs4 import BeautifulSoup
import requests
import pandas as pd

# Define the URL to scrape
url = 'https://www.cuhk.edu.hk/english/campus/accommodation.html'

# Define a User-Agent header to avoid 403 error
headers = {'User-Agent': 'Mozilla/5.0'}

# Send a GET request to the URL with the headers
response = requests.get(url, headers=headers)

# Parse the HTML content with BeautifulSoup
soup = BeautifulSoup(response.text, 'html.parser')

# Find the div element with id "canteen_info"
canteen_div = soup.find('div', {'id': 'canteen_info'})

# Find the table element within the canteen_div
canteen_table = canteen_div.find('table', {'class': 'table contact-table'})

# Extract table data into a pandas DataFrame
df = pd.read_html(str(canteen_table))[0]

# Rename the first column to "Name"
df.rename(columns={'Unnamed: 0': 'Name'}, inplace=True)

# Export the DataFrame to a CSV file
df.to_csv('cuhk_canteen.csv', index=False)