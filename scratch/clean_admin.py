
import os

file_path = r'c:\Users\giath\Desktop\Sales store - Albraa\src\pages\AdminPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove lines from the one containing 'tagsInput' down to the next ')}' before 'Category Modal'
# Based on previous view_file, these are roughly 1617 to 1653

new_lines = []
skip = False
for line in lines:
    if 'placeholder="عسل, طبيعي, سدر"' in line and 'tagsInput' in line:
        skip = True
    
    if not skip:
        new_lines.append(line)
    
    if skip and ')}' in line and 'Category Modal' not in line:
        # Check if next line is 'Category Modal' or similar to be sure
        # But for now, let's just stop skipping after the first )} found after tagsInput
        skip = False

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File cleaned successfully.")
