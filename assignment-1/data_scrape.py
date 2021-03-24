# import csv
# with open('./data/ststdsadata.csv', newline='') as csvfile:
#     spamreader = csv.reader(csvfile, delimiter=' ', quotechar='|')
#     for row in spamreader:
#         print(', '.join(row))

import pandas as pd
data = pd.read_csv('./data/ststdsadata.csv', encoding= 'unicode_escape')
print(data)

