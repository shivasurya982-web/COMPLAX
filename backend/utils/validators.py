import re

def validate_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def validate_password(password):
    return len(password) >= 6

def validate_dataset_csv(df):
    required_columns = ['complaint', 'priority']
    if not all(col in df.columns for col in required_columns):
        return False, f"Missing columns. Required: {', '.join(required_columns)}"

    valid_priorities = ['High', 'Medium', 'Low']
    if not df['priority'].isin(valid_priorities).all():
        return False, "Invalid priority values. Must be High, Medium, or Low."

    if df['complaint'].isnull().any() or (df['complaint'] == '').any():
        return False, "Complaint text cannot be empty."

    return True, "Valid"
