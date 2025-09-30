import random

def determine_reward(coins, fruit1, fruit2, fruit3):
    if fruit1 == fruit2 == fruit3:
        print('Jackpot! You get 10 coins!')
        return coins - 1 + 10
    elif fruit1 == fruit2 or fruit2 == fruit3 or fruit1 == fruit3:
        print('Double! You get 3 coins.')
        return coins - 1 + 3
    else:
        print('You did not get any coins.')
        return coins - 1

def goodbye_print(coins, initial_coins):
    if coins > initial_coins:
        print(f'You won {coins - initial_coins} coin(s).')
    elif coins == initial_coins:
        print('You did not win anything...')
    elif coins < initial_coins:
        print(f'You lost {initial_coins - coins} coin(s).')

def ask_for_coins(minimum_coins, maximum_coins):
    while True:
        print('How many coins would you like to insert?')
        coins = int(input())

        if minimum_coins <= coins <= maximum_coins:
            return coins

def ask_to_play(coins):
    while True:
        print(f'You have {coins} coins. Would you like to continue (yes=1, no=0)?')
        choice = int(input())

        if choice == 0:
            return False
        elif choice == 1:
            return True
    

def ask_and_set_seed(input_text):
    user_seed = int(input(input_text))
    random.seed(user_seed)

def get_random_fruits():
    fruits = ['🍇', '🍉', '🍊', '🍋', '🥭', '🍎', '🍐', '🍑', '🍒', '🥝']
    fruit1 = random.choice(fruits)
    fruit2 = random.choice(fruits)
    fruit3 = random.choice(fruits)
    return fruit1, fruit2, fruit3

def print_slots(fruit1, fruit2, fruit3):
    slots = f"""
╔════════════╗
║┌──┐┌──┐┌──┐║
║│{fruit1}││{fruit2}││{fruit3}│║
║└──┘└──┘└──┘║
╚════════════╝\n"""
    print(slots)


def main():

    user_seed = int(input("What is your lucky number?\n"))
    random.seed(user_seed)
    current_coins = ask_for_coins(1, 100)
    initial_coins = current_coins
    play_again = True
    
    while play_again and current_coins > 0:
        random_fruit1, random_fruit2, random_fruit3 = get_random_fruits()
        print_slots(random_fruit1, random_fruit2, random_fruit3)
        current_coins = determine_reward(current_coins, random_fruit1, random_fruit2, random_fruit3)
        if current_coins > 0:
            play_again = ask_to_play(current_coins)

    goodbye_print(current_coins, initial_coins)

main()