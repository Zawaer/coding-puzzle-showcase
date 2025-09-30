def main():
    print('-- Lamp diagnostics --')
    print('Is the lamp switched on? (yes=1, no=0)')
    switched_on = int(input())

    if switched_on == 0:
        print('Switch on the lamp.')
        return


    print('Is the lamp plugged in? (yes=1, no=0)')
    plugged_in = int(input())

    if plugged_in == 0:
        print('Plug the lamp into an outlet.')
        return

    print('Do other electrical devices work in the room? (yes=1, no=0)')
    other_devices_working = int(input())

    if other_devices_working == 0:
        print('Check the breaker.')
        return

    print("The lamp should work, but I don't know why it doesn't...")

main()