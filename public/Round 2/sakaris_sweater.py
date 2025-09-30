def main():
    print('Dress Sakari in a sweater (no=0, yes=1)?')

    sweater = int(input())

    if sweater == 1:
        print('It tickles. You won the game!')
    elif sweater == 0:
        print('You lost the game!')
    else:
        print('Try again!')

main()