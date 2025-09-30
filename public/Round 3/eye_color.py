def main():
    print("Enter the mother's alleles (BB, Bb, or bb):")
    mothers_alleles = input()

    print("Enter the father's alleles (BB, Bb, or bb):")
    fathers_alleles = input()

    if mothers_alleles == "bb" and fathers_alleles == "bb":
        print('Their child is 100% likely to have blue eyes.')
    elif mothers_alleles == "BB" and fathers_alleles == "BB":
        print('Their child is 100% likely to have brown eyes.')
    elif mothers_alleles == "Bb" and fathers_alleles == "Bb":
        print('Their child is 75% likely to have brown eyes and 25% likely to have blue eyes.')
    elif (mothers_alleles == "BB" and fathers_alleles == "Bb") or (fathers_alleles == "BB" and mothers_alleles == "Bb"):
        print('Their child is 100% likely to have brown eyes.')
    elif (mothers_alleles == "BB" and fathers_alleles == "bb") or (fathers_alleles == "BB" and mothers_alleles == "bb"):
        print('Their child is 100% likely to have brown eyes.')
    elif (mothers_alleles == "Bb" and fathers_alleles == "bb") or (fathers_alleles == "Bb" and mothers_alleles == "bb"):
        print('Their child is 50% likely to have brown eyes and 50% likely to have blue eyes.')
    

main()