def moving_average(data, ws):
    length = int(len(data) - ws + 1)
    
    averages = []
    for i in range(length):
        averages.append(sum(data[i:i + ws]) / ws)

    return averages



def all_in_range(data, min_value, max_value):
    for val in data:
        if val < min_value or val > max_value:
            return False

    return True    



def debug_check(result, model):
    if result == model:
        print(f"┌ PASSED\n├ code:  {result}\n└ model: {model}\n")
    else:
        print(f"┌ FAILED\n├ code:  {result}\n└ model: {model}\n")

def main():

    DEBUG = False

    if DEBUG:
        print("+ moving_average()\n")
        res, mod = moving_average([1, 2, 3, 4, 5], 2), [1.5, 2.5, 3.5, 4.5]
        debug_check(res, mod)
        res, mod = moving_average([5, 4, 3, 2, 1], 3), [4.0, 3.0, 2.0]
        debug_check(res, mod)
        res, mod = moving_average([1, 2, 3, 4, 5], 5), [3.0]
        debug_check(res, mod)

        print("+ all_in_range()\n")
        res, mod = all_in_range([-2, 1, 0, 2, -1], -2, 2), True
        debug_check(res, mod)
        res, mod = all_in_range([-2, 1, 0, 2, -1], -1.9, 5), False
        debug_check(res, mod)
        res, mod = all_in_range([3.37, -3.54, -2.8, -2.0, -2.69, 9.06, 3.35], -3.54, 9.06), True
        debug_check(res, mod)

    else:
        minimum = 0
        maximum = 0
        while True:
            print('What is the MINIMUM temperature the medication can tolerate?')
            minimum = float(input())

            print('What is the MAXIMUM temperature the medication can tolerate?')
            maximum = float(input())

            if minimum < maximum:
                break
        
        ws = 0
        while True:
            print('How many minutes to include in the average?')
            ws = int(input())

            if ws > 0:
                break
            
        measurement_count = 0
        while True:
            print('How many measurements to input?')
            measurement_count = int(input())

            if measurement_count >= ws:
                break
        

        measurements = []
        print('Input measurements:')
        for i in range(measurement_count):
            measurements.append(float(input()))
        
        averages = moving_average(measurements, ws)
        if all_in_range(averages, minimum, maximum):
            print('The medication was stored properly!')
        else:
            print('The medication was not stored properly, check with the manufacturer...')

        print(f'Log: {averages}')


main()