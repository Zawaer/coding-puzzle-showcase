PARS = [1, 2, 3, 4, 2, 3, 5, 3, 2]

strokes = []

def main():
    print('The pars for the holes are:')
    for i, par in enumerate(PARS):
        print(f'HOLE {i + 1}: {par}')

    for i, par in enumerate(PARS):
        print(f'Enter the number of strokes for the hole {i + 1}:')
        strokes.append(int(input()))

    print('Here is how your round went:')

    for i, stroke in enumerate(strokes):
        score = ''
        if stroke == PARS[i]:
            score = 'a par'
        elif stroke > PARS[i]:
            score = 'above par'
        elif stroke < PARS[i]:
            score = 'below par'
        print(f'On hole {i + 1} you scored {score}!')

main()