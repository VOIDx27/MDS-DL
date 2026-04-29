import json
import uuid
from datetime import datetime, timedelta
import random

def generate_vpa(name, bank):
    clean_name = "".join(c for c in name.lower() if c.isalnum())
    suffix = {"SBI": "@sbi", "HDFC": "@hdfcbank", "Axis": "@okaxis", "ICICI": "@icici"}.get(bank, "@upi")
    return f"{clean_name}{random.randint(10,99)}{suffix}"

def create_account(role, bank, kyc="MIN", ring_id=None):
    acc_id = f"ACC-{uuid.uuid4().hex[:8]}"
    return {
        "id": acc_id,
        "vpa": generate_vpa(role, bank),
        "bank": bank,
        "kycTier": kyc,
        "accountAge": random.randint(5, 365),
        "mobileHash": uuid.uuid4().hex[:16],
        "deviceIds": [f"IMEI-{uuid.uuid4().hex[:10]}"],
        "muleScore": 0.0,
        "isFlagged": False,
        "ringId": ring_id,
        "createdAt": (datetime.utcnow() - timedelta(days=random.randint(5, 365))).isoformat()
    }

def create_transaction(src_id, tgt_id, amount, ts, bank, state):
    return {
        "source_id": src_id,
        "target_id": tgt_id,
        "utr": f"UTR{random.randint(100000000000, 999999999999)}",
        "amount": round(amount, 2),
        "timestamp": ts.isoformat(),
        "upiApp": random.choice(["GPay", "PhonePe", "Paytm", "BHIM"]),
        "bank": bank,
        "city": "Unknown",
        "state": state,
        "status": "SUCCESS"
    }

def generate_scenario_1():
    # Mule Network: 1 fraudster -> 10 tier-1 -> 40 tier-2 -> 5 cash-out
    accounts = []
    transactions = []
    ring_id = f"RING-MULE-{uuid.uuid4().hex[:6]}"
    
    banks = ["SBI", "HDFC", "Axis"]
    
    fraudster = create_account("fraudster", random.choice(banks), "NONE", ring_id)
    accounts.append(fraudster)
    
    tier1 = [create_account("mule1", random.choice(banks), "MIN", ring_id) for _ in range(10)]
    tier2 = [create_account("mule2", random.choice(banks), "MIN", ring_id) for _ in range(40)]
    cashout = [create_account("cashout", random.choice(banks), "FULL", ring_id) for _ in range(5)]
    
    accounts.extend(tier1)
    accounts.extend(tier2)
    accounts.extend(cashout)
    
    start_time = datetime.utcnow() - timedelta(days=18)
    
    # 200 transactions
    for _ in range(200):
        t1_mule = random.choice(tier1)
        amount = random.uniform(8000, 48000)
        
        # Fraudster to Tier 1
        ts1 = start_time + timedelta(days=random.uniform(0, 17), hours=random.uniform(0, 23))
        transactions.append(create_transaction(fraudster["id"], t1_mule["id"], amount, ts1, fraudster["bank"], "Delhi"))
        
        # Tier 1 to Tier 2 (split into 4)
        split_amount = amount / 4
        t2_mules = random.sample(tier2, 4)
        for t2 in t2_mules:
            ts2 = ts1 + timedelta(minutes=random.uniform(15, 45))
            transactions.append(create_transaction(t1_mule["id"], t2["id"], split_amount, ts2, t1_mule["bank"], "UP"))
            
            # Tier 2 to Cashout
            c_out = random.choice(cashout)
            ts3 = ts2 + timedelta(minutes=random.uniform(15, 45))
            transactions.append(create_transaction(t2["id"], c_out["id"], split_amount * 0.98, ts3, t2["bank"], "Maharashtra"))
            
    return {"scenario": "Mule Network", "accounts": accounts, "transactions": transactions}

def generate_scenario_2():
    # Carousel Ring: 10 accounts same bank, 300 txns over 72h
    accounts = []
    transactions = []
    ring_id = f"RING-CAROUSEL-{uuid.uuid4().hex[:6]}"
    bank = "ICICI"
    
    for i in range(10):
        accounts.append(create_account(f"carousel{i}", bank, "FULL", ring_id))
        
    start_time = datetime.utcnow() - timedelta(hours=72)
    amount = 25000.0
    
    ts = start_time
    for _ in range(300):
        src = random.choice(accounts)
        tgt = random.choice([a for a in accounts if a["id"] != src["id"]])
        
        ts += timedelta(minutes=random.uniform(5, 14)) # 300 txns over 72h -> avg 14.4 mins
        transactions.append(create_transaction(src["id"], tgt["id"], amount, ts, bank, "Karnataka"))
        
    return {"scenario": "Carousel Ring", "accounts": accounts, "transactions": transactions}

def generate_scenario_3():
    # Layering Chain: 8 accounts, 8 banks, 40 txns over 6 hours
    accounts = []
    transactions = []
    ring_id = f"RING-LAYERING-{uuid.uuid4().hex[:6]}"
    
    banks = ["SBI", "HDFC", "Axis", "ICICI", "PNB", "BOB", "Union", "Canara"]
    states = ["Delhi", "Haryana", "UP", "MP", "Maharashtra", "Telangana", "Karnataka", "Tamil Nadu"]
    
    for i in range(8):
        accounts.append(create_account(f"layer{i}", banks[i], "MIN", ring_id))
        
    start_time = datetime.utcnow() - timedelta(hours=6)
    
    for _ in range(5): # 5 chains of 8 hops = 40 txns
        ts = start_time + timedelta(minutes=random.uniform(0, 60))
        amount = 45000.0
        
        for i in range(7):
            src = accounts[i]
            tgt = accounts[i+1]
            transactions.append(create_transaction(src["id"], tgt["id"], amount, ts, src["bank"], states[i]))
            
            amount *= 0.98 # 2% erosion
            ts += timedelta(minutes=random.uniform(2, 10))
            
    return {"scenario": "Layering Chain", "accounts": accounts, "transactions": transactions}

def main():
    s1 = generate_scenario_1()
    s2 = generate_scenario_2()
    s3 = generate_scenario_3()
    
    export_data = {
        "scenarios": [s1, s2, s3],
        "all_accounts": s1["accounts"] + s2["accounts"] + s3["accounts"],
        "all_transactions": s1["transactions"] + s2["transactions"] + s3["transactions"]
    }
    
    with open("simulation/scenarios.json", "w") as f:
        json.dump(export_data, f, indent=2)
        
    print(f"Generated {len(export_data['all_accounts'])} accounts and {len(export_data['all_transactions'])} transactions.")

if __name__ == "__main__":
    main()
