def cookies(servings):
    SUGAR_COOKIES = 4.4 
    BUTTER = 9
    FLOUR_COOKIES = 11
    CHOCOLATE_CHIPS = 3
    needed_sugar = servings * SUGAR_COOKIES
    needed_butter = servings * BUTTER
    needed_flour = servings * FLOUR_COOKIES
    needed_chocolate = servings * CHOCOLATE_CHIPS
    print()
    print("For the cookies you need:")
    print(f"{needed_sugar:.2f} g of sugar.")
    print(f"{needed_butter} g of butter.")
    print(f"{needed_flour} g of flour.")
    print(f"{needed_chocolate} g of chocolate chips.")

def cake(servings):
    EGGS = 4
    FLOUR_CAKE = 100
    SUGAR_CAKE = 148
    MILK = 3
    SERVING_SIZE = 12
    print("One cake serves 12 people.")
    cakes_needed = int(servings / SERVING_SIZE) + (servings % SERVING_SIZE > 0)
    if cakes_needed == 1:
        print('You only need to make 1 cake!')
    else:
        print(f'You need to make {cakes_needed} cakes!')
    needed_sugar = cakes_needed * SUGAR_CAKE
    needed_eggs = cakes_needed * EGGS
    needed_flour = cakes_needed * FLOUR_CAKE
    needed_milk = cakes_needed * MILK
    print()
    print("Here are your ingredients:")
    print(f"{needed_sugar} g of sugar.")
    print(f"{needed_eggs} eggs.")
    print(f"{needed_flour} g of flour.")
    print(f"{needed_milk} dl of milk.")



def main():
    print('What do you want to make (0=cookies, 1=cake)? ')
    choice = int(input())

    print('For how many people are you baking for?')
    servings = int(input())

    if choice == 0:
        cookies(servings)
    elif choice == 1:
        cake(servings)

main()