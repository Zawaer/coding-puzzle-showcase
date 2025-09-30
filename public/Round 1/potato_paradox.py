print('We have 100 kg of potatoes that are 99% water. Now we dehydrate the potatoes.')
print('What is the new water content? (%)')
new_water_content = int(input())

percentage_of_solids = (100 - new_water_content) / 100

print(f'The new weight of the potatoes is {1/percentage_of_solids} kg.')