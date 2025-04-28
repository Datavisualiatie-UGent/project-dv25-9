import kagglehub
import os

# Set the target download directory to the data directory
current_dir = os.path.dirname(os.path.abspath(__file__))
os.environ['KAGGLEHUB_CACHE'] = current_dir

# Download latest version directly to the data directory
path = kagglehub.dataset_download(
    "artyomkruglov/gaming-profiles-2025-steam-playstation-xbox"
)

print("Path to dataset files:", path)