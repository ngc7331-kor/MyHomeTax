import os

def replace_in_file(file_path, old_str, new_str):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    new_content = content.replace(old_str, new_str)
    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {file_path}")

target_dir = r"C:\Users\DSC\Desktop\Google_Antigravity\MyHomeTax\App\android"
old_pkg = "com.antigravity.ltobank"
new_pkg = "com.antigravity.my_home_tax_app"

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith(('.kt', '.java', '.xml', '.gradle', '.kts', '.json', '.plist')):
            replace_in_file(os.path.join(root, file), old_pkg, new_pkg)
            replace_in_file(os.path.join(root, file), "ltobank", "my_home_tax_app")

print("패키지명 치환 완료.")
