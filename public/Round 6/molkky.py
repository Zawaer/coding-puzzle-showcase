def count_points(points):
    if len(points) == 1:
        return int(points[0])
    else:
        return len(points)


def main():
    print('Enter all players. Stop with an empty line.')

    players = {}
    while True:
        print('Enter the name of the player:')
        name = input()

        if name == '':
            break

        if name in players:
            print(f"You've already added {name}.")
        else:
            players[name] = 0
    

    # game
    while True:
        for player in players:
            print(f"{player}'s turn!")

            print("Enter all the skittles that were knocked over, separate the numbers by commas:")
            skittles_knocked = input()
            players[player] += count_points(skittles_knocked.split(","))

            if players[player] > 50:
                players[player] = 25

            print('\nCurrent situation:')
            winner = ''

            for player, points in players.items():
                print(f'{player}: {points}')
                if points == 50:
                    winner = player
            
            print('')
            
            if winner:
                print(f'The winner is {winner}!')
                return




main()