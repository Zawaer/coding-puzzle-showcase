def main():
    print('How many species would you like to classify?')
    species_count = int(input())

    endangered = 0
    critically_endangered = 0

    for i in range(1, species_count + 1):
        print(f'{i} | Species name:')
        species_name = input()

        population_count = 0
        while True:
            print('Population count:')
            population_count = int(input())

            if population_count >= 0:
                break

        print('Average population size change per year in percent:')
        population_size_change = float(input())

        print('Average habitat size change per year in percent:')
        habitat_size_change = float(input())

        conservation_status = ''

        if population_count < 2500 and population_size_change < 0 and habitat_size_change <= -50:
            conservation_status = 'CRITICALLY ENDANGERED'
            critically_endangered += 1
        elif population_count < 10000 and population_size_change < 0 and habitat_size_change <= -25:
            conservation_status = 'ENDANGERED'
            endangered += 1
        elif population_count < 20000 and population_size_change < 0:
            conservation_status = 'VULNERABLE'
        elif population_size_change < 0 or habitat_size_change <= -15:
            conservation_status = 'NEAR THREATENED'
        elif population_size_change >= 0 and habitat_size_change > -15:
            conservation_status = 'LEAST CONCERN'


        print(f'The species {species_name} is classified as {conservation_status}.\n')

    print(f'There were {critically_endangered} critically endangered and {endangered} endangered species.')


main()