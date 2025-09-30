def main():
    while True:
        print('What is the map scale 1:n?')
        map_scale = int(input())

        if map_scale > 0:
            break
    
    while True:
        print('What was the measurement in centimeters (negative numbers to quit)?')
        measurement = float(input())

        if measurement < 0:
            print('Quitting...')
            break

        print(f'The scaled distance in kilometers is {map_scale * measurement / 100000}')


main()