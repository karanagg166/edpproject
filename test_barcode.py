from barcode_scanner import lookup_product
import sys

print("Testing lookup_product for Coca-Cola (0049000028904)...")
product = lookup_product("0049000028904")
print(product)

if not product:
    print("FAILED")
    sys.exit(1)

print("SUCCESS")
