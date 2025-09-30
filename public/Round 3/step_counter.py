def main():
    print('Enter your height in cm:')
    height = int(input())

    stride_length = height/100 * 0.413

    print('How many days do you want to record?')
    days_count = int(input())

    step_goal_reached = 0

    for i in range(1, days_count + 1):
        print(f'What is your step goal for the day {i}?')
        step_goal = int(input())

        print(f'Enter the journeys you walked on the day {i}. Enter a negative number when you have entered all the journeys.')

        distance_walked_meters = 0
        journey_counter = 1
        while True:
            print(f'Distance of the journey {journey_counter} in meters:')
            distance = int(input())

            if distance < 0:
                break
            
            distance_walked_meters += distance
            
            journey_counter += 1

        step_count = int(distance_walked_meters / stride_length)
        print(f'You walked {step_count} steps on the day {i}!')
        
        if step_count >= step_goal:
            step_goal_reached += 1

    print(f'You reached your step goal on {step_goal_reached} day(s)!')

main()