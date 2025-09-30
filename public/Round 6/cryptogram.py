import random

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
SENTENCES = [
    "I am on my way to see you.",
    "You are in the big blue house.",
    "The sun is up, and I am happy.",
    "A cat is in the box with a toy.",
    "My dog is on the bed asleep.",
    "We go to the park for a walk.",
    "She is at home with her cat.",
    "The boy is by the tall tree.",
    "I have a pen and a pad for notes.",
    "You and I are on a fun trip.",
]

def create_cipher(text):
    text_alphabet = []
    for letter in ALPHABET:
        if letter in text:
            text_alphabet.append(letter)
    text_alphabet_shuffled = text_alphabet.copy()
    random.shuffle(text_alphabet_shuffled)

    cipher = {}
    decryption_cipher = {}

    for i, letter in enumerate(text_alphabet):
        decryption_cipher[text_alphabet_shuffled[i]] = letter
        cipher[letter] = text_alphabet_shuffled[i]

    return cipher, decryption_cipher

def apply_cipher(text, cipher):
    val = ''
    for letter in text:
        if letter in cipher:
            val += cipher[letter]
        elif letter in ALPHABET:
            val += '_'
        else:
            val += letter
    
    return val

def guess_input(reverse_cipher, found_cipher):
    letter = ''
    while True:
        print('Guess the letter in the shuffled text:')
        letter = input().upper()

        if letter not in reverse_cipher:
            print(f"'{letter}' is not in the cryptogram.")
        elif letter in found_cipher:
            print(f"You already correctly guessed '{letter}'.")
        else:
            break

    print(f"What does '{letter}' map to:")
    mapped = input().upper()

    return (letter, mapped)

def print_progress(shuffled_text, found_cipher):
    print('')
    print(f'Shuffled: {shuffled_text}')
    print(f'Progress: {apply_cipher(shuffled_text, found_cipher)}')
    print('')

def main():
    random.seed(int(input("Set the seed:\n")))
    original_text = random.choice(SENTENCES).upper()
    
    cipher, decryption_cipher = create_cipher(original_text)

    shuffled_sentence = apply_cipher(original_text, cipher)

    found = {}
    won = False

    while True:
        print_progress(shuffled_sentence, found)

        if won:
            break

        guessed_1, guessed_2 = guess_input(decryption_cipher, found)

        if guessed_1 in decryption_cipher:
            if decryption_cipher[guessed_1] == guessed_2:
                print(f"Correct! '{guessed_1}' is '{guessed_2}'.")
                found[guessed_1] = guessed_2

                if len(found) == len(decryption_cipher):
                    print('You solved the cryptogram!')
                    won = True
            else:
                print(f"Incorrect. '{guessed_1}' is not '{guessed_2}'.")


main()