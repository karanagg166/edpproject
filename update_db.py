import json


def get_real_data(name, category):
    name_l = name.lower()

    # Defaults
    room = 7
    fridge = 14
    freezer = 90
    serving = 100

    # Specific mappings
    if category == "fruits":
        if name_l in ["banana", "plantain"]:
            room, fridge, freezer, serving = 5, 7, 180, 118
        elif name_l in ["apple"]:
            room, fridge, freezer, serving = 7, 28, 240, 182
        elif name_l in ["orange", "kinnow"]:
            room, fridge, freezer, serving = 7, 21, 240, 131
        elif name_l in ["lemon", "lime"]:
            room, fridge, freezer, serving = 14, 30, 180, 58
        elif name_l in ["grape", "strawberry", "blueberry", "cherry"]:
            room, fridge, freezer, serving = 2, 7, 180, 140
        elif name_l in ["watermelon", "mango", "papaya", "pineapple"]:
            room, fridge, freezer, serving = 3, 7, 180, 150
        else:
            room, fridge, freezer, serving = 5, 14, 180, 100

    elif category == "vegetables":
        if name_l in ["potato", "sweet potato"]:
            room, fridge, freezer, serving = 21, 90, 240, 213
        elif name_l in ["onion", "garlic"]:
            room, fridge, freezer, serving = 30, 60, 240, 110
        elif name_l in ["tomato"]:
            room, fridge, freezer, serving = 5, 14, 240, 123
        elif name_l in ["spinach", "lettuce", "cabbage"]:
            room, fridge, freezer, serving = 1, 5, 180, 85
        elif name_l in ["carrot", "radish", "turnip"]:
            room, fridge, freezer, serving = 3, 21, 240, 61
        elif name_l in ["broccoli", "cauliflower", "bell pepper"]:
            room, fridge, freezer, serving = 3, 7, 240, 90
        elif name_l in ["cucumber", "zucchini"]:
            room, fridge, freezer, serving = 3, 7, 180, 300
        else:
            room, fridge, freezer, serving = 5, 14, 240, 100

    elif category == "dairy":
        if name_l in ["milk"]:
            room, fridge, freezer, serving = 0, 7, 90, 244
        elif name_l in ["cheese", "paneer"]:
            room, fridge, freezer, serving = 0, 14, 180, 30
        elif name_l in ["yogurt", "curd"]:
            room, fridge, freezer, serving = 0, 14, 60, 150
        elif name_l in ["butter", "ghee"]:
            room, fridge, freezer, serving = 30, 90, 365, 14
        else:
            room, fridge, freezer, serving = 0, 10, 90, 100

    elif category == "meat_poultry":
        if name_l in ["chicken", "poultry"]:
            room, fridge, freezer, serving = 0, 2, 270, 174
        elif name_l in ["beef", "pork", "lamb", "mutton"]:
            room, fridge, freezer, serving = 0, 3, 180, 113
        elif name_l in ["bacon", "sausage"]:
            room, fridge, freezer, serving = 0, 7, 60, 35
        elif name_l in ["egg"]:
            room, fridge, freezer, serving = 0, 21, 365, 50
        else:
            room, fridge, freezer, serving = 0, 3, 180, 100

    elif category == "seafood":
        room, fridge, freezer, serving = 0, 2, 180, 85

    elif category == "grains_staples":
        if name_l in ["bread", "roti", "chapati"]:
            room, fridge, freezer, serving = 5, 7, 90, 35
        elif name_l in ["rice", "wheat", "flour", "pasta", "oats"]:
            room, fridge, freezer, serving = 365, 365, 365, 100
        else:
            room, fridge, freezer, serving = 180, 365, 365, 100

    elif category == "legumes_dals":
        room, fridge, freezer, serving = 365, 365, 365, 100

    elif category == "nuts_seeds":
        room, fridge, freezer, serving = 90, 180, 365, 28

    elif category == "spices_herbs":
        room, fridge, freezer, serving = 730, 730, 730, 5

    elif category == "oils_condiments":
        room, fridge, freezer, serving = 180, 365, 365, 15

    elif category == "beverages":
        room, fridge, freezer, serving = 180, 180, 180, 240

    elif category == "packaged_snacks":
        room, fridge, freezer, serving = 180, 180, 180, 30

    else:
        room, fridge, freezer, serving = 30, 60, 180, 100

    return room, fridge, freezer, serving


def fix_keywords(name):
    # Instead of ["banana", "banana", "banana"], use unique meaningful keywords
    name_l = name.lower()
    kw = [name_l]
    if " " in name_l:
        kw.extend(name_l.split(" "))

    # some manual mapping
    aliases = {
        "banana": ["plantain", "kela"],
        "tomato": ["tamatar", "cherry tomato"],
        "chicken": ["murgi", "poultry"],
        "potato": ["aloo"],
        "onion": ["pyaaz"],
        "milk": ["dudh"],
        "water": ["pani"],
        "rice": ["chawal"],
    }

    if name_l in aliases:
        kw.extend(aliases[name_l])

    return list(set(kw))


with open("food_database.json", "r") as f:
    db = json.load(f)

for item in db["items"]:
    room, fridge, freezer, serving = get_real_data(item["name"], item["category"])
    item["shelf_life_room_days"] = room
    item["shelf_life_fridge_days"] = fridge
    item["shelf_life_freezer_days"] = freezer
    item["serving_size_g"] = serving
    item["keywords"] = fix_keywords(item["name"])

with open("food_database.json", "w") as f:
    json.dump(db, f, indent=2)

print("Updated food_database.json")
