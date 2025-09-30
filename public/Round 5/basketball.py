def main():
    LIMIT = 6.75                        # meters
    FIELD_GOAL_NORMAL = 2             
    THREE_POINTER = 3              

    total_points = []

    number_of_goals = int(input("How many field goals did you make?\n"))
    field_goals = [0.0] * number_of_goals
    for i in range(number_of_goals):
        one_goal = float(input(f"How far from the basket did you throw the field goal {i+1} (m)?\n"))
        field_goals[i] = one_goal
    print("Field goals:")

    # Implement your own code here that goes through the list of
    # distances and prints the points from each field goal
    for length in field_goals:
        if length >= LIMIT:
            points = THREE_POINTER
        else:
            points = FIELD_GOAL_NORMAL
        print(f'{points} points.')
        total_points.append(points)

    print(f'You got {sum(total_points)} points in total!')

main()