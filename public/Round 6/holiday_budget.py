def create_budget():
    print("Create budget / format: category,spending_limit / press enter to continue:")
    budget = {}
    text = input()
    while text != "":
        input_details = text.split(',')
        category, limit = input_details[0], input_details[1]
        limit = float(limit)

        if category == "":
            print("The category cannot be empty.")
        elif limit < 0:
            print("The limit cannot be negative.")
        else:
            if category in budget:
                print('The category is already in the budget.')
            else:
                budget[category] = limit
        
        text = input()
    return budget


def add_expenses(budget):
    print("Add expenses / format: category,amount_paid / press enter to continue:")
    text = input()
    while text != "":
        input_details = text.split(',')
        category, amount = input_details[0], input_details[1]
        amount = float(amount)
        if amount <= 0:
            print("The amount must be positive.")
        else:
            if category not in budget:
                print('The category is not in the budget.')
            else:
                new_amount = budget[category] - amount
                print(f'{category}: {budget[category]:0.2f}e -> {new_amount:0.2f}e')
                budget[category] = new_amount

                if new_amount < 0:
                    print('You have exceeded your limit!')

        text = input()


def print_budget(budget):
    print("Current budget / amount of money left in each category:")
    for category, amount in budget.items():
        print(f"{f'{category}':30s} | {amount:6.2f}e")


def main():
    print("Holiday Budget", '-' * 30)
    budget = create_budget()
    add_expenses(budget)
    print_budget(budget)

main()
