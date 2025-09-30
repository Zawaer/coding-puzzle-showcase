def main():
    sleep_for_minutes = 0
    hours = 8
    minutes = 0

    while True:
        print(f"It is {hours:02d}:{minutes:02d}!")
        print('Choose an action:')
        print('0. Snooze.')
        print('1. Wake up.')

        action = int(input())

        if action == 1:
            print('Good morning!')
            break
        elif action == 0:
            print('For how many minutes do you want to snooze?')
            sleep_for_minutes = int(input())

            if sleep_for_minutes < 60 - minutes:
                minutes += sleep_for_minutes
            elif sleep_for_minutes == 60:
                hours += 1
                minutes = 0
            else:
                total_minutes = minutes + sleep_for_minutes
                hours += total_minutes // 60
                minutes = total_minutes % 60

main()