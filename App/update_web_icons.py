from PIL import Image
import os

def update_web_icons(source_path, web_icons_dir):
    try:
        img = Image.open(source_path).convert("RGBA")
        
        icon_files = [
            ("Icon-192.png", (192, 192)),
            ("Icon-512.png", (512, 512)),
            ("Icon-maskable-192.png", (192, 192)),
            ("Icon-maskable-512.png", (512, 512))
        ]
        
        for filename, size in icon_files:
            target_path = os.path.join(web_icons_dir, filename)
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            resized_img.save(target_path, "PNG")
            print(f"Saved {target_path}")
            
        # Also update favicon
        favicon_path = os.path.join(os.path.dirname(web_icons_dir), "favicon.png")
        img.resize((32, 32), Image.Resampling.LANCZOS).save(favicon_path, "PNG")
        print(f"Saved {favicon_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    source = r"C:\Users\DSC\Desktop\Google_Antigravity\Image\MyHomeTax_app-icon.jpg"
    target_dir = r"C:\Users\DSC\Desktop\Google_Antigravity\MyHomeTax\App\web\icons"
    update_web_icons(source, target_dir)
