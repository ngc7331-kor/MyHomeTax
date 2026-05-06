from PIL import Image, ImageDraw
import os

def round_corners(image_path, output_path, radius):
    try:
        img = Image.open(image_path).convert("RGBA")
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, img.size[0], img.size[1]), radius=radius, fill=255)
        result = Image.new("RGBA", img.size)
        result.paste(img, (0, 0), mask=mask)
        # Resize to a reasonable size for widget logo if needed, or just save
        result.thumbnail((512, 512), Image.Resampling.LANCZOS)
        result.save(output_path, "PNG")
        print(f"Successfully saved widget logo to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    input_file = r"C:\Users\DSC\Desktop\Google_Antigravity\Image\MyHomeTax_app-icon.jpg"
    output_file = r"C:\Users\DSC\Desktop\Google_Antigravity\MyHomeTax\App\android\app\src\main\res\drawable\ic_widget_logo.png"
    
    # Create directory if not exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    round_corners(input_file, output_file, radius=100)
