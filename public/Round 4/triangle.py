import math

def calculate_b(a_length, c_length):
    return math.sqrt(c_length ** 2 - a_length ** 2)

def calculate_area(a_length, b_length):
    return (a_length * b_length) / 2

def main():
    print('Triangle calculator')

    one_leg_length = 0
    hypotenuse_length = 0

    while True:
        print('Enter the length of one leg (side):')
        one_leg_length = float(input())

        print('Enter the length of the hypotenuse:')
        hypotenuse_length = float(input())

        if one_leg_length < hypotenuse_length and one_leg_length > 0 and hypotenuse_length > 0:
            break

    b_length = calculate_b(one_leg_length, hypotenuse_length)
    print(f'The length of b is {b_length:0.2f} and the area of the triangle is {calculate_area(one_leg_length, b_length):0.2f}.')

main()