from datetime import date, timedelta

# Build dictionary of existing date data
date_file = 'date_log.txt'
date_dict = {}
try:
    with open(date_file, 'r') as f:
        for line in f:
            date_key = line.strip()
            if date_key:
                date_dict[date_key] = 1
except FileNotFoundError:
        print(f"Error: The file '{date_file}' was not found.")
except Exception as e:
    print(f"An error occurred: {e}")

# Get today's date
today = date.today()

# Create a list to store the dates
new_dates = []

# Loop through the past 30 days, 
for i in range(30,-1,-1):
    curr_date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
    if curr_date not in date_dict:
        new_dates.append(curr_date)
        date_dict[curr_date] = 1

with open('date_log.txt', 'w') as f:
    for key in date_dict:
        f.write(key + '\n')

with open('get_prev_prices.sh', 'w') as f:
    for d in new_dates:
        f.write(f'curl -O https://tcgcsv.com/archive/tcgplayer/prices-{d}.ppmd.7z\n')

with open('extract_prev_prices.sh', 'w') as f:
    for d in new_dates:
        f.write(f'7z x prices-{d}.ppmd.7z\n')