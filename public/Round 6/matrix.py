import random

def create_and_fill_matrix(rows, cols):  # 1
    matrix = []  # 2
    for i in range(rows):  # 3
        one_row = []  # 4
        for j in range(cols):  # 5
            a_random_value = random.randint(10, 99)  # 6
            one_row.append(a_random_value)  # 7

        matrix.append(one_row)  # 8

    return matrix


def print_matrix(matrix):
    rows = len(matrix)
    cols = len(matrix[0])

    for i in range(rows):
        for j in range(cols):
            print(f"{matrix[i][j]:>8d}", end="")
        print()



def find_list_of_local_max(matrix):
    maxima = []
    for y, row in enumerate(matrix):
        for x, elem in enumerate(row):
            if y == 0 or x == 0 or y == len(matrix) - 1 or x == len(row) - 1:
                continue
            else:
                if elem > matrix[y][x - 1] and elem > matrix[y][x + 1] and elem > matrix[y - 1][x] and elem > matrix[y + 1][x] and elem > matrix[y - 1][x - 1] and elem > matrix[y - 1][x + 1] and elem > matrix[y + 1][x - 1] and elem > matrix[y + 1][x + 1]:
                    maxima.append(elem)
        
    return maxima

def print_one_dim_list(val):
    local_maxima = val[:]
    local_maxima.sort()
    if local_maxima:
        print(*local_maxima, sep=' ')
    else:
        print('')  

def flipping_cols(matrix):
    new_matrix = matrix[:]

    for row in new_matrix:
        row.reverse()

    return new_matrix

def flipping_rows(matrix):
    new_matrix = matrix[:]
    new_matrix.reverse()
    return new_matrix

def find_max_value_and_its_position(matrix):
    max_val = 0
    max_val_row, max_val_col = 0, 0
    for i, row in enumerate(matrix):
        for j, val in enumerate(row):
            if val > max_val:
                max_val = val
                max_val_row = i + 1
                max_val_col = j + 1
    
    return max_val, max_val_row, max_val_col


def main():
    seed_number = int(input("Enter a seed :\n"))
    random.seed(seed_number)

    line = input("Enter the first integer number (the number of rows) :\n")
    n = int(line)
    line = input("Enter the second integer number (the number of columns) :\n")
    m = int(line)
    print('')

    matrix = create_and_fill_matrix(n, m)

    print('initial matrix')
    print_matrix(matrix)

    max_val, max_val_row, max_val_col = find_max_value_and_its_position(matrix)
    print(f'\nthe maximum is {max_val} in row {max_val_row} and column {max_val_col}')

    print('\nflipped matrix')
    print_matrix(flipping_rows(matrix))

    print(f'\nThe list of local maxima in ascending order:')
    local_maxima = find_list_of_local_max(matrix)
    print_one_dim_list(local_maxima)

    print('flipped matrix')
    print_matrix(flipping_cols(matrix))
    print('')

main()