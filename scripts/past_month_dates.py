from datetime import date, timedelta

# Get today's date
today = date.today()

# Create a list to store the dates
past_30_days = []

# Loop through the past 30 days
for i in range(30):
    # Calculate the date for each day
    current_date = today - timedelta(days=i)
    # Format the date as 'YYYY-MM-DD' and add it to the list
    past_30_days.append(current_date.strftime("%Y-%m-%d"))

# Get and print the list of dates
with open('get_prev_prices.sh', 'w') as f:
    for d in past_30_days:
        f.write(f'curl -O  https://tcgcsv.com/archive/tcgplayer/prices-{d}.ppmd.7z\n')

with open('extract_prev_prices.sh', 'w') as f:
    for d in past_30_days:
        f.write(f'7z x prices-{d}.ppmd.7z\n')