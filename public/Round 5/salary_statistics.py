import math

def read_salaries():
    print('Enter the salaries of the summer one by one.')
    print('Stop by entering a negative value.')

    salaries = []
    while True:
        salary = float(input())

        if salary < 0:
            break

        salaries.append(salary)
    
    return salaries

def calculate_average(salary_list):
    if len(salary_list) == 0:
        return 0.0
    return sum(salary_list) / len(salary_list)

def calculate_standard_deviation(salary_list):
    if len(salary_list) == 0:
        return 0.0
    
    average = calculate_average(salary_list)

    subtractions = []
    for salary in salary_list:
        subtractions.append((salary - average)**2)
    
    return math.sqrt(sum(subtractions) / len(salary_list))

def calculate_salaries_below_limit(salary_list, upper_limit):
    if len(salary_list) == 0:
        return 0.0
    
    salaries_under_limit = []
    for salary in salary_list:
        if salary < upper_limit:
            salaries_under_limit.append(salary)
    
    return len(salaries_under_limit) / len(salary_list) * 100

def calculate_salaries_over_limit(salary_list, lower_limit):
    if len(salary_list) == 0:
        return 0.0
    
    salaries_over_limit = []
    for salary in salary_list:
        if salary > lower_limit:
            salaries_over_limit.append(salary)
    
    return len(salaries_over_limit) / len(salary_list) * 100



def main():
    print('The program calculates statistics for the salaries of students.')
    salaries = read_salaries()
        
    print('Statistics (salary statistics for the entire summer):')
    print(f'The average of the salaries is {calculate_average(salaries):0.2f} eur and')
    print(f'the standard deviation is {calculate_standard_deviation(salaries):0.2f} eur.')

    print(f'{calculate_salaries_below_limit(salaries, calculate_average(salaries) * 0.75):0.2f} % of students had a salary less than 75 % of the average.')
    print(f'{calculate_salaries_over_limit(salaries, calculate_average(salaries) * 1.5):0.2f} % of students had a salary at least 1.5 times larger than the average.')

    print('Specify a salary limit to determine how many students exceed it.')
    salary_limit = float(input())

    print(f'{calculate_salaries_over_limit(salaries, salary_limit):0.2f} % of students earned more than {salary_limit:0.2f} euros.')

main()