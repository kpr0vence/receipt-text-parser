# receipt-text-parser
Developed a proof of concept script for parsing the lines of text on a receipt to get the food item on that line, if it exists. 

It uses REgex to clean the strings and Fuse to perform a fuzzy match referencing a list of food items, and a list of non-food items. The program picks the result with higher confidence.