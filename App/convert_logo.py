from PIL import Image, ImageDraw

def round_corners(image_path, output_path, radius):
    try:
        # Load image
        img = Image.open(image_path).convert("RGBA")
        
        # Create a mask with rounded corners
        mask = Image.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, img.size[0], img.size[1]), radius=radius, fill=255)
        
        # Apply the mask
        result = Image.new("RGBA", img.size)
        result.paste(img, (0, 0), mask=mask)
        
        # Save the result
        result.save(output_path, "PNG")
        print(f"Successfully saved rounded image to {output_path}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    input_file = r"C:\Users\DSC\Desktop\Google_Antigravity\MyHomeTax_App\assets\icon\app-icon.jpg"
    output_file = r"C:\Users\DSC\Desktop\Google_Antigravity\MyHomeTax_App\android\app\src\main\res\drawable\ic_widget_logo.png"
    # Radius of 100 for a noticeable rounded corner on a high-res image
    round_corners(input_file, output_file, radius=150)
