# project-dv25-9

## Running the project

### Downloading the data

1. Install kaggle & kagglehub:
```shell
pip install kaggle
pip install kagglehub
```

2. Authenticate in kaggle. You'll need a kaggle token for this
```shell
kaggle config set -n path.kaggle_token_file -v path/to/your/kaggle.json
```

3. Run the script to install the data:
```shell
cd src/data
python download_data.py
```

### Installing dependencies

Go back to the root of the repository and install the needed packages:
```shell
npm install
```

### Starting the website

Run the development server:
```shell
npm run dev
```