def main():
    print('This program will record your electric scooter trips.')
    
    total_minutes = 0
    total_trips = 0

    while True:
        print(f'Enter the length of the {"first" if total_trips == 0 else "next"} trip (min). End with a negative value.')
        first_trip_length = int(input())

        if first_trip_length < 0 and total_trips == 0:
            print('You did not enter any trips.')
            return

        if first_trip_length < 0:
            break

        total_minutes += first_trip_length
        total_trips += 1
    
    print(f'You spent a total of {total_minutes} minutes and {1.5 * total_trips + total_minutes * 0.22} euros on your electric scooter trips.')

main()