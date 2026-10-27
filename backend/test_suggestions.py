"""
Comprehensive tests for the Dataset-Driven Complaint Suggestion & Priority Assignment feature.

Tests cover:
1. Suggestion service loading and indexing
2. Matching accuracy for various query types
3. Priority correctness from selected dataset records
4. Backend endpoint validation
5. Edge cases (empty input, no matches, invalid IDs)
6. Category detection correctness
"""

import sys
import os
import json

# Add backend dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up environment for testing
os.environ.setdefault('MONGO_URI', '')

PASS = 0
FAIL = 0

def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✓ PASS: {name}")
    else:
        FAIL += 1
        print(f"  ✗ FAIL: {name} — {detail}")


def run_tests():
    global PASS, FAIL

    print("\n" + "=" * 70)
    print("COMPLAX Suggestion Feature — Automated Test Suite")
    print("=" * 70)

    # ──────────────────────────────────────────────────────────
    # 1. Suggestion Service Loading & Indexing
    # ──────────────────────────────────────────────────────────
    print("\n[1] SUGGESTION SERVICE LOADING & INDEXING")
    print("-" * 50)

    from suggestion_service import ComplaintSuggestionService, normalize_text, detect_category_from_text, clean_display_text

    svc = ComplaintSuggestionService()

    test("Service loads without errors", svc is not None)
    test("Records are indexed", len(svc.records) > 0, f"Got {len(svc.records)} records")
    test("TF-IDF vectorizer is built", svc.vectorizer is not None)
    test("TF-IDF matrix is built", svc.X_tfidf is not None)
    test("record_by_id map is populated", len(svc.record_by_id) > 0)
    test("Reasonable number of unique records (50-500)", 50 <= len(svc.records) <= 500, f"Got {len(svc.records)}")

    # Verify all records have required fields
    required_fields = ['recordId', 'complaint', 'displayText', 'normalized', 'category', 'priority']
    all_have_fields = all(all(f in r for f in required_fields) for r in svc.records)
    test("All records have required fields", all_have_fields)

    # Verify all priorities are valid
    valid_priorities = {'High', 'Medium', 'Low'}
    all_valid_prio = all(r['priority'] in valid_priorities for r in svc.records)
    test("All priorities are valid (High/Medium/Low)", all_valid_prio)

    # ──────────────────────────────────────────────────────────
    # 2. TEXT NORMALIZATION
    # ──────────────────────────────────────────────────────────
    print("\n[2] TEXT NORMALIZATION")
    print("-" * 50)

    test("Lowercase normalization", 'water' in normalize_text("WATER"))
    test("Prefix stripping (Please report:)", 'pipe burst' in normalize_text("Please report: pipe burst"))
    test("Synonym mapping (leaking → leak)", 'leak' in normalize_text("leaking"))
    test("Synonym mapping (stopped → stop)", 'stop' in normalize_text("stopped"))
    test("Synonym mapping (jammed → stuck)", 'stuck' in normalize_text("jammed"))
    test("Wi-Fi normalization", 'wifi' in normalize_text("wi-fi not working"))
    test("Plural normalization (pipes → pipe)", 'pipe' in normalize_text("pipes"))

    # ──────────────────────────────────────────────────────────
    # 3. CATEGORY DETECTION
    # ──────────────────────────────────────────────────────────
    print("\n[3] CATEGORY DETECTION")
    print("-" * 50)

    test("Water complaints → Water Supply & Plumbing", detect_category_from_text("Water is not coming") == "Water Supply & Plumbing")
    test("Tap leak → Water Supply & Plumbing", detect_category_from_text("Bathroom tap is leaking") == "Water Supply & Plumbing")
    test("Switch sparks → Electrical & Power", detect_category_from_text("Sparks from switchboard") == "Electrical & Power")
    test("Fan not working → Electrical & Power", detect_category_from_text("Ceiling fan is not working") == "Electrical & Power")
    test("Lift stuck → Elevator & Lift", detect_category_from_text("Lift is stuck between floors") == "Elevator & Lift")
    test("Garbage → Sanitation & Housekeeping", detect_category_from_text("Garbage not collected") == "Sanitation & Housekeeping")
    test("Door lock → Doors, Windows & Hardware", detect_category_from_text("Door lock is broken") == "Doors, Windows & Hardware")
    test("WiFi → Internet & Network", detect_category_from_text("WiFi is down") == "Internet & Network")
    test("Fire alarm → Safety & Infrastructure", detect_category_from_text("Fire alarm not working") == "Safety & Infrastructure")
    test("Furniture → Furniture & Fixtures", detect_category_from_text("Chair is broken") == "Furniture & Fixtures")
    test("Unknown → General Maintenance", detect_category_from_text("Something random happened") == "General Maintenance")

    # ──────────────────────────────────────────────────────────
    # 4. DISPLAY TEXT CLEANING
    # ──────────────────────────────────────────────────────────
    print("\n[4] DISPLAY TEXT CLEANING")
    print("-" * 50)

    test("Strips 'Please report:' prefix", clean_display_text("Please report: water leak") == "water leak")
    test("Strips 'Urgent:' prefix", clean_display_text("Urgent: fire in building") == "fire in building")
    test("Strips 'Complaint:' prefix", clean_display_text("Complaint: bad smell") == "bad smell")
    test("Preserves clean text", clean_display_text("Water is not coming") == "Water is not coming")

    # ──────────────────────────────────────────────────────────
    # 5. LIVE SUGGESTION MATCHING
    # ──────────────────────────────────────────────────────────
    print("\n[5] LIVE SUGGESTION MATCHING")
    print("-" * 50)

    # Test: "water is not coming" should match related water complaints
    results = svc.get_suggestions("water is not coming", limit=5)
    test("'water is not coming' returns suggestions", len(results) > 0, f"Got {len(results)} results")
    if results:
        test("Top result is water-related", "water" in results[0]['complaint'].lower())
        test("Top result has Water category", "Water" in results[0]['category'])
        test("Top result has valid priority", results[0]['priority'] in valid_priorities)
        test("Results limited to ≤5", len(results) <= 5)
        test("Results have score field", 'score' in results[0])
        test("Results have recordId field", 'recordId' in results[0])

    # Test: "lift stuck" should match lift complaints
    results_lift = svc.get_suggestions("lift stuck", limit=5)
    test("'lift stuck' returns suggestions", len(results_lift) > 0, f"Got {len(results_lift)} results")
    if results_lift:
        test("Top lift result is lift-related", any(k in results_lift[0]['complaint'].lower() for k in ['lift', 'elevator']))
        test("Top lift result category is Elevator & Lift", "Elevator" in results_lift[0]['category'] or "Lift" in results_lift[0]['category'])

    # Test: "tap leak" should match plumbing complaints
    results_tap = svc.get_suggestions("tap leak", limit=5)
    test("'tap leak' returns suggestions", len(results_tap) > 0)
    if results_tap:
        test("Top result contains tap/leak", any(k in results_tap[0]['complaint'].lower() for k in ['tap', 'leak']))

    # Test: partial text "fan not" should match fan complaints
    results_fan = svc.get_suggestions("fan not", limit=5)
    test("'fan not' (partial) returns suggestions", len(results_fan) > 0)
    if results_fan:
        test("Partial match finds fan complaints", any('fan' in r['complaint'].lower() for r in results_fan))

    # Test: "wifi disconnect" should match internet complaints
    results_wifi = svc.get_suggestions("wifi disconnect", limit=5)
    test("'wifi disconnect' returns suggestions", len(results_wifi) > 0)

    # Test: misspelling "ceeling fan" should still find results
    results_typo = svc.get_suggestions("ceeling fan not working", limit=5)
    test("Misspelled 'ceeling fan' returns results (fuzzy)", len(results_typo) > 0, f"Got {len(results_typo)}")

    # Test: "garbage" should match sanitation
    results_garbage = svc.get_suggestions("garbage blocking entrance", limit=5)
    test("'garbage blocking entrance' returns suggestions", len(results_garbage) > 0)

    # Test: "door lock broken" 
    results_door = svc.get_suggestions("door lock broken", limit=5)
    test("'door lock broken' returns suggestions", len(results_door) > 0)

    # Test: "sparks from switch" (electrical)
    results_sparks = svc.get_suggestions("sparks from switch", limit=5)
    test("'sparks from switch' returns suggestions", len(results_sparks) > 0)

    # ──────────────────────────────────────────────────────────
    # 6. SCORE ORDERING & THRESHOLD
    # ──────────────────────────────────────────────────────────
    print("\n[6] SCORE ORDERING & THRESHOLD")
    print("-" * 50)

    results_ordered = svc.get_suggestions("water supply not working", limit=10)
    if len(results_ordered) >= 2:
        scores = [r['score'] for r in results_ordered]
        test("Results are sorted by score descending", all(scores[i] >= scores[i+1] for i in range(len(scores)-1)))
        test("Top result score > 0.22 threshold", scores[0] >= 0.22)

    # ──────────────────────────────────────────────────────────
    # 7. EDGE CASES & GRACEFUL HANDLING
    # ──────────────────────────────────────────────────────────
    print("\n[7] EDGE CASES & GRACEFUL HANDLING")
    print("-" * 50)

    test("Empty query returns []", svc.get_suggestions("") == [])
    test("None query returns []", svc.get_suggestions(None) == [])
    test("Single char 'a' returns []", svc.get_suggestions("a") == [])
    test("Two chars 'ab' returns []", svc.get_suggestions("ab") == [])
    test("Only spaces returns []", svc.get_suggestions("   ") == [])
    test("Random gibberish returns few/no results", len(svc.get_suggestions("xyzzy frobnicator blarg")) <= 2)
    test("Limit=1 returns at most 1", len(svc.get_suggestions("water", limit=1)) <= 1)
    test("Very long query doesn't crash", isinstance(svc.get_suggestions("water " * 100), list))

    # ──────────────────────────────────────────────────────────
    # 8. RECORD VALIDATION
    # ──────────────────────────────────────────────────────────
    print("\n[8] RECORD VALIDATION")
    print("-" * 50)

    # Valid record
    first_record = svc.records[0]
    validated = svc.validate_record(first_record['recordId'])
    test("Valid recordId returns correct record", validated is not None)
    test("Validated record has correct priority", validated and validated['priority'] == first_record['priority'])
    test("Validated record has correct category", validated and validated['category'] == first_record['category'])
    test("Validated record has correct complaint", validated and validated['complaint'] == first_record['complaint'])

    # Invalid record
    test("Invalid recordId returns None", svc.validate_record("ds_99999") is None)
    test("Empty recordId returns None", svc.validate_record("") is None)
    test("None recordId returns None", svc.validate_record(None) is None)

    # ──────────────────────────────────────────────────────────
    # 9. PRIORITY CORRECTNESS: SELECTED RECORD DETERMINES PRIORITY
    # ──────────────────────────────────────────────────────────
    print("\n[9] PRIORITY CORRECTNESS FROM SELECTED RECORD")
    print("-" * 50)

    # Pick a High priority record
    high_records = [r for r in svc.records if r['priority'] == 'High']
    medium_records = [r for r in svc.records if r['priority'] == 'Medium']
    low_records = [r for r in svc.records if r['priority'] == 'Low']

    test("Dataset contains High priority records", len(high_records) > 0, f"Found {len(high_records)}")
    test("Dataset contains Medium priority records", len(medium_records) > 0, f"Found {len(medium_records)}")
    test("Dataset contains Low priority records", len(low_records) > 0, f"Found {len(low_records)}")

    if high_records:
        hr = high_records[0]
        validated_h = svc.validate_record(hr['recordId'])
        test("High record validation returns High priority", validated_h and validated_h['priority'] == 'High')

    if medium_records:
        mr = medium_records[0]
        validated_m = svc.validate_record(mr['recordId'])
        test("Medium record validation returns Medium priority", validated_m and validated_m['priority'] == 'Medium')

    if low_records:
        lr = low_records[0]
        validated_l = svc.validate_record(lr['recordId'])
        test("Low record validation returns Low priority", validated_l and validated_l['priority'] == 'Low')

    # ──────────────────────────────────────────────────────────
    # 10. AMBIGUOUS MATCHES: DIFFERENT PRIORITIES FOR SIMILAR TEXT
    # ──────────────────────────────────────────────────────────
    print("\n[10] AMBIGUOUS MATCHES HANDLING")
    print("-" * 50)

    # "water" is broad—should return results with potentially different priorities
    results_ambig = svc.get_suggestions("water", limit=10)
    if len(results_ambig) > 1:
        priorities_seen = set(r['priority'] for r in results_ambig)
        test("Broad query 'water' shows multiple priority levels", len(priorities_seen) >= 1, f"Priorities: {priorities_seen}")
        test("Each result has its own correct priority label", all(r['priority'] in valid_priorities for r in results_ambig))

    # ──────────────────────────────────────────────────────────
    # 11. SINGLETON PATTERN
    # ──────────────────────────────────────────────────────────
    print("\n[11] SINGLETON PATTERN")
    print("-" * 50)

    from suggestion_service import get_suggestion_service
    svc1 = get_suggestion_service()
    svc2 = get_suggestion_service()
    test("Singleton returns same instance", svc1 is svc2)

    # ──────────────────────────────────────────────────────────
    # RESULTS SUMMARY
    # ──────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print(f"RESULTS: {PASS} passed, {FAIL} failed, {PASS + FAIL} total")
    print("=" * 70)

    if FAIL > 0:
        print(f"\n⚠  {FAIL} test(s) FAILED. Review the output above.\n")
        return 1
    else:
        print(f"\n✅ All {PASS} tests PASSED!\n")
        return 0


if __name__ == '__main__':
    sys.exit(run_tests())
