print('How many minutes has the device been charging for?')
minutes = int(input())

print('How many percentage points did the charge increase during this period?')
percentage = int(input())

print('What is the current battery percentage?')
current_percentage = int(input())

charging_speed = percentage / minutes
print(f'Charging speed (%/min): {charging_speed}')

print(f'Minutes until full: {((100 - current_percentage) / charging_speed)}')