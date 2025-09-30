import random

BOARD = [[1, 2, 3, 4, 5], 
        [16, 17, 18, 19, 6],
        [15, 24, 25, 20, 7],
        [14, 23, 22, 21, 8],
        [13, 12, 11, 10, 9]]


OUT_OF_BOUND = -1
BOARD_SIZE = 5
HOLE = "x"
CARROT = "Y"
STEP = "o"
BUNNY = "B"
MIDDLE = 2
NUMBER_OF_HOLES = 6

def print_board(game_board):
    for row in game_board:
        string = ""
        for point in row:
            string += f"{point} "
        print(string)
    print()

def create_board():
    game_board = []
    for i in range(BOARD_SIZE):
        one_row = []
        for j in range(BOARD_SIZE):
            one_row.append(STEP)
        game_board.append(one_row)
    for i in range(NUMBER_OF_HOLES):
        random_row = random.randint(0, BOARD_SIZE - 1)
        random_column = random.randint(0, BOARD_SIZE - 1)
        game_board[random_row][random_column] = HOLE
    game_board[MIDDLE][MIDDLE] = CARROT
    return game_board

def one_throw():
    max_throw = int(input("Enter the maximum value for the move:\n"))
    while max_throw < 1 or max_throw > 6:
        print("The value must be between 1 and 6!")
        max_throw = int(input("Enter the maximum value for the move:\n"))
    throw = random.randint(1, max_throw)
    print(f"You got a {throw}!")
    return throw


def move_bunny(bunny_position, throw):
    current_pos = 0

    if bunny_position == [OUT_OF_BOUND, OUT_OF_BOUND]:
        current_pos = 0
    else:
        current_pos = BOARD[bunny_position[0]][bunny_position[1]]

    current_pos += throw

    if current_pos >= 25:
        return [MIDDLE, MIDDLE]

    for i, y in enumerate(BOARD):
        for j, x in enumerate(y):
            if x == current_pos:
                return [i, j]

def main():
    bunny_position = [OUT_OF_BOUND, OUT_OF_BOUND]
    print("Welcome to play funny bunny!")
    seed_number = int(input("Enter a seed:\n"))
    random.seed(seed_number)
    game_board = create_board()
    print_board(game_board)


    move_count = 0
    while True:
        move_count += 1

        throw = one_throw()
        
        bunny_position = move_bunny(bunny_position, throw)
        replaced_board_element = game_board[bunny_position[0]][bunny_position[1]]
        game_board[bunny_position[0]][bunny_position[1]] = BUNNY

        fell_into_hole = False
        if replaced_board_element == HOLE:
            fell_into_hole = True
            print('Your bunny fell into a hole!')
            game_board[bunny_position[0]][bunny_position[1]] = HOLE
            bunny_position = [OUT_OF_BOUND, OUT_OF_BOUND]

        won = False
        if game_board[MIDDLE][MIDDLE] == BUNNY:
            print(f'You won the game in {move_count} moves!')
            won = True

        print_board(game_board)

        if not fell_into_hole:
            game_board[bunny_position[0]][bunny_position[1]] = replaced_board_element

        if won:
            return

        


    # write rest of the main program here

main()