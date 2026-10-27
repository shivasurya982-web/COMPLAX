import sys
sys.path.append('c:/COMPLAX/backend')
from suggestion_service import get_suggestion_service

svc = get_suggestion_service()
print("Service initialized!")

for q in ['water is not coming', 'lift', 'tap leak', 'sparks from switch', 'fan not working', 'wifi problem', 'broken lock']:
    s = svc.get_suggestions(q, limit=3)
    print(f"\nSuggestions for '{q}': ({len(s)})")
    for item in s:
        print(f"  - [{item['priority']:6}] [{item['category']:25}] {item['displayText']} (id: {item['recordId']})")

print("\nValidation test:")
rec = svc.validate_record('ds_0001')
print("ds_0001:", rec)
fake = svc.validate_record('ds_fake_999')
print("ds_fake_999:", fake)
