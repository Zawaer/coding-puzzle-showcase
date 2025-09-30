# Write here the function kannus_to_liters
def kannus_to_liters():
    print('How many kannus?')
    kannus = float(input())
    print(f'{kannus} kannus is {(kannus * 2.6172):0.2f} liters.')

# Write here the function liters_to_kannus
def liters_to_kannus():
    print('How many liters?')
    liters = float(input())
    print(f'{liters} liters is {(liters / 2.6172):0.2f} kannus.')


def main():
    print("Welcome to the kannu converter!")
    choice = -1
    while choice != 3:
        print("1) kannus to liters")
        print("2) liters to kannus")
        print("3) quit")
        choice = int(input())
        print()
        if choice == 1:
            # Write here the appropriate function call
            kannus_to_liters()
        elif choice == 2:
            # Write here the appropriate function call
            liters_to_kannus()
        print()
main()