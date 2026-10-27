import uuid

def generate_user_id():
    return f"USR-{uuid.uuid4().hex[:8].upper()}"

def generate_org_id():
    return f"ORG-{uuid.uuid4().hex[:8].upper()}"

def generate_complaint_id():
    return f"CMP-{uuid.uuid4().hex[:8].upper()}"

def generate_category_id():
    return f"CAT-{uuid.uuid4().hex[:8].upper()}"

def generate_dataset_request_id():
    return f"DSR-{uuid.uuid4().hex[:8].upper()}"
